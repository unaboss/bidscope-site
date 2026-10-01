import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, confirmPublicCheckout, startPublicCheckout } from '@/api'
import { Button } from '@/components/ui/button'

type State = 'idle' | 'confirming' | 'done' | 'error'

/** Formats ZAR cents for display, e.g. 31920 → R319.20. */
function formatRands(cents: number): string
{
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(cents / 100)
}

/**
 * Public checkout for a just-signed-up account: the visitor pays before setting
 * a password. The signed `token` (from signup) authorises starting the charge;
 * Paystack then returns to this page with a `reference` we confirm server-side.
 */
export function CheckoutPage()
{
    const [params] = useSearchParams()
    const token = params.get('token') ?? ''
    const reference = params.get('reference') ?? params.get('trxref') ?? ''

    const [state, setState] = useState<State>(reference !== '' ? 'confirming' : 'idle')
    const [error, setError] = useState('')
    const [price, setPrice] = useState<number | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() =>
    {
        if (reference === '')
        {
            return
        }

        let cancelled = false

        confirmPublicCheckout(reference)
            .then(() =>
            {
                if (!cancelled)
                {
                    setState('done')
                }
            })
            .catch(() =>
            {
                if (!cancelled)
                {
                    setState('error')
                    setError('We could not confirm your payment. If you were charged, contact support@northtech.africa.')
                }
            })

        return () =>
        {
            cancelled = true
        }
    }, [reference])

    async function subscribe(): Promise<void>
    {
        if (token === '')
        {
            setError('This checkout link is missing or has expired. Start again from the pricing section.')
            return
        }

        setBusy(true)
        setError('')

        try
        {
            const checkout = await startPublicCheckout(token)

            setPrice(checkout.amountCents)
            window.location.href = checkout.authorizationUrl
        }
        catch (caught)
        {
            setBusy(false)
            setError(caught instanceof ApiError ? caught.message : 'Could not start checkout. Please try again.')
        }
    }

    return (
        <div className="min-h-dvh bg-cream text-ink">
            <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
                <Link to="/" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">North Tech</Link>
                <a href="/login" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 hover:text-ink">Sign in</a>
            </header>

            <main className="mx-auto max-w-xl px-6 pb-24">
                {state === 'confirming' && (
                    <section className="mt-10">
                        <h1 className="text-3xl font-semibold">Confirming your payment…</h1>
                        <p className="mt-3 text-sm text-ink/60">Hold on a moment while we check with Paystack.</p>
                    </section>
                )}

                {state === 'done' && (
                    <section className="mt-10">
                        <h1 className="text-3xl font-semibold">Payment received.</h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/70">
                            Your subscription is active. Open the activation email we sent you to set your password — then sign in and your plan is ready.
                        </p>
                        <div className="mt-8">
                            <a href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-navy px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cream transition-colors hover:bg-navy/90">
                                Go to sign in
                            </a>
                        </div>
                    </section>
                )}

                {state === 'idle' && (
                    <section className="mt-10">
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50">Subscribe</p>
                        <h1 className="mt-3 text-3xl font-semibold">Start your subscription</h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/70">
                            <strong>20% off your first month</strong>, applied automatically, then standard monthly
                            billing. Cancel anytime.
                        </p>

                        <div className="mt-8">
                            <Button onClick={() => void subscribe()} disabled={busy}>
                                {busy ? 'Starting…' : `Subscribe${price !== null ? ` — ${formatRands(price)}` : ''}`}
                            </Button>
                        </div>

                        <p className="mt-4 text-xs text-ink/50">
                            Prefer to try it first? You can still <Link to="/join" className="underline">start a free trial</Link>.
                        </p>
                    </section>
                )}

                {error !== '' && (
                    <p role="alert" className="mt-6 text-sm text-wax">{error}</p>
                )}
            </main>
        </div>
    )
}

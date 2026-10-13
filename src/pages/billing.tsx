import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, confirmCheckout, getAccount, getSettings, startCheckout } from '@/api'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { TIER_CENTS, TIER_NAMES, tierForProvinces } from '@/lib/pricing'
import type { Account, Settings } from '@/types'

/** Plan and province count shown on the card. */
function planLabel(provinces: number): string
{
    const name = TIER_NAMES[tierForProvinces(provinces)]

    return provinces === 0 || provinces > 4 ? `${name} · all provinces` : `${name} · ${provinces} province${provinces === 1 ? '' : 's'}`
}

/** Billing page: plan, trial and a Paystack subscribe action. */
export function BillingPage()
{
    const [params, setParams] = useSearchParams()
    const [account, setAccount] = useState<Account | null>(null)
    const [settings, setSettings] = useState<Settings | null>(null)
    const [message, setMessage] = useState('')
    const [busy, setBusy] = useState(false)

    const load = useCallback(async (): Promise<void> =>
    {
        const [loadedAccount, loadedSettings] = await Promise.all([getAccount(), getSettings()])

        setAccount(loadedAccount)
        setSettings(loadedSettings)
    }, [])

    useEffect(() =>
    {
        void load()
    }, [load])

    // Returning from Paystack: confirm the reference, then drop it from the URL.
    useEffect(() =>
    {
        const reference = params.get('reference') ?? params.get('trxref')

        if (reference === null)
        {
            return
        }

        void confirmCheckout(reference)
            .then(() => { setMessage('Payment received — your plan is being activated.'); return load() })
            .catch(() => setMessage('We could not confirm the payment yet. It will update shortly.'))
            .finally(() =>
            {
                const next = new URLSearchParams(params)
                next.delete('reference')
                next.delete('trxref')
                next.delete('status')
                setParams(next, { replace: true })
            })
    }, [params, setParams, load])

    async function subscribe(): Promise<void>
    {
        setBusy(true)
        setMessage('')

        try
        {
            const result = await startCheckout()

            window.location.href = result.authorizationUrl
        }
        catch (error)
        {
            setMessage(error instanceof ApiError ? error.message : 'Could not start checkout.')
            setBusy(false)
        }
    }

    const provinces = settings?.provinces.length ?? 0
    const rands = TIER_CENTS[tierForProvinces(provinces)] / 100
    const plan = account?.effectivePlan ?? '—'

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="Account" title="Billing" description="Your plan, trial and subscription." />

            <section className="max-w-xl rounded-xl border border-line bg-panel p-6 shadow-panel">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{planLabel(provinces)}</p>
                        <p className="mt-1 text-3xl font-semibold">R{rands}<span className="text-sm font-normal text-ink/50">/month</span></p>
                    </div>
                    <p className="text-sm text-ink/60">Current plan: <strong>{plan}</strong></p>
                </div>

                <div className="mt-6">
                    <Button onClick={() => void subscribe()} disabled={busy}>
                        {busy ? 'Starting…' : 'Subscribe'}
                    </Button>
                    <p className="mt-2 text-xs text-ink/45">
                        Secure checkout via Paystack. You can cancel any time.
                    </p>
                </div>


                {account?.trialActive === true && account.trialEndsAt !== null && (
                    <p className="mt-4 text-sm text-ink/60">
                        Free trial until <strong>{account.trialEndsAt}</strong>
                        {account.trialDaysLeft !== null && ` (${account.trialDaysLeft} days left)`}.
                    </p>
                )}

                {message !== '' && <p className="mt-4 text-sm text-navy">{message}</p>}
            </section>
        </div>
    )
}

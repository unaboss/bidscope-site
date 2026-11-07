import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CaretRightIcon, CheckIcon } from '@phosphor-icons/react'
import { ApiError, confirmCheckout, getAccount, getSettings, startCheckout } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/page-header'
import { TIER_CENTS, TIER_NAMES, tierForProvinces } from '@/features/billing/pricing'
import { formatDate } from '@/shared/lib/format'
import type { Account, Settings } from '@/shared/types'

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

    const trialEnd = account?.trialEndsAt ?? null
    const included = account?.features.filter((feature) => feature.enabled) ?? []
    const notIncluded = account?.features.filter((feature) => !feature.enabled) ?? []

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Account"
                title="Billing"
                description="Your plan, its coverage, and what renews when."
                actions={
                    <Button onClick={() => void subscribe()} disabled={busy}>
                        {busy ? 'Starting…' : plan === 'pro' ? 'Manage subscription' : 'Change plan'}
                    </Button>
                }
            />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <section className="rounded-xl border border-line bg-panel p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                        <div>
                            <h2 className="text-lg font-semibold text-ink">{planLabel(provinces)}</h2>
                            <p className="mt-1 flex items-baseline gap-1 text-ink">
                                <span className="text-3xl font-semibold tabular-nums">R{rands}</span>
                                <span className="text-sm text-ink/55">per month, billed in ZAR</span>
                            </p>
                        </div>
                    </div>

                    <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs text-ink/55">Provinces covered</dt>
                            <dd className="mt-0.5 text-sm font-medium text-ink">
                                {provinces === 0 ? 'Nationwide' : provinces}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ink/55">
                                {account?.trialActive === true ? 'Trial ends' : 'Renews'}
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-ink">
                                {account?.trialActive === true && trialEnd !== null
                                    ? `${formatDate(trialEnd)}${account.trialDaysLeft !== null ? ` · ${account.trialDaysLeft} days left` : ''}`
                                    : 'Monthly, until cancelled'}
                            </dd>
                        </div>
                    </dl>

                    <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink/50">
                        Checkout runs through Paystack. Cancel any time; access continues to the end of the
                        paid period.
                    </p>

                    {message !== '' && (
                        <p role="status" className="mt-4 rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink">
                            {message}
                        </p>
                    )}
                </section>

                <section className="flex flex-col gap-4">
                    <div className="rounded-xl border border-line bg-panel p-5">
                        <h2 className="text-sm font-semibold text-ink">Included in your plan</h2>
                        <ul className="mt-3 flex flex-col gap-2">
                            {included.map((feature) => (
                                <li key={feature.key} className="flex items-start gap-2 text-sm text-ink/75">
                                    <CheckIcon size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />
                                    {feature.label}
                                </li>
                            ))}
                        </ul>
                        {notIncluded.length > 0 && (
                            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink/50">
                                Not on this plan: {notIncluded.map((feature) => feature.label).join(', ')}.
                            </p>
                        )}
                    </div>

                    <Link
                        to="/profile"
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-5 py-4 text-sm font-medium text-ink transition-colors hover:border-navy/40 hover:bg-navy/[0.04]"
                    >
                        Change your provinces and categories
                        <CaretRightIcon size={15} aria-hidden="true" className="shrink-0 text-ink/40" />
                    </Link>
                </section>
            </div>
        </div>
    )
}

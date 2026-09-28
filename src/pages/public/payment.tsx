import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/** Monthly price (ZAR) for a province count; 0 = nationwide (all provinces). */
function monthlyFor(provinces: number): number
{
    if (provinces === 0 || provinces >= 5)
    {
        return 799
    }

    if (provinces === 1)
    {
        return 399
    }

    return 599
}

/** Plain-language plan name for the province band. */
function planLabel(provinces: number): string
{
    if (provinces === 0)
    {
        return 'All provinces (nationwide)'
    }

    if (provinces === 1)
    {
        return '1 province'
    }

    return provinces <= 4 ? `2–4 provinces (${provinces})` : `All provinces (${provinces})`
}

interface JoinState
{
    readonly qualified?: number
    readonly total?: number
    readonly trialEndsAt?: string
    readonly provinces?: number
}

/**
 * Funnel step 4 — the payment page. The trial is already active from signup; this
 * page is clearly framed as the free-trial choice, with R0 charged today. The
 * Paystack checkout is wired in step 3, so the card action is inert for now.
 */
export function PaymentPage()
{
    const state = (useLocation().state ?? {}) as JoinState
    const provinces = state.provinces ?? 0
    const price = monthlyFor(provinces)

    return (
        <div className="min-h-dvh bg-cream text-ink">
            <header className="mx-auto flex max-w-xl items-center justify-between px-6 py-6">
                <Link to="/" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
                    North Tech
                </Link>
                <a href="/login" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 hover:text-ink">
                    Sign in
                </a>
            </header>

            <main className="mx-auto max-w-xl px-6 pb-24">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50">Free trial · step 3 of 3</p>
                <h1 className="mt-6 text-3xl font-semibold">Start your free trial</h1>

                {state.trialEndsAt !== undefined && (
                    <p className="mt-3 text-sm leading-relaxed text-ink/60">
                        Your workspace is ready. The trial is free until <strong>{state.trialEndsAt}</strong>;
                        after that your plan continues at <strong>R{price}/month</strong>.
                    </p>
                )}

                <section className="mt-8 rounded-xl border border-line bg-panel p-5 shadow-panel">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{planLabel(provinces)}</p>
                            <p className="mt-1 text-2xl font-semibold">R0 <span className="text-sm font-normal text-ink/50">today</span></p>
                        </div>
                        <p className="text-sm text-ink/60">then R{price}/month</p>
                    </div>

                    <div className="mt-5 rounded-lg border border-navy/20 bg-navy/5 px-4 py-3">
                        <p className="text-sm font-medium text-navy">You are choosing the free trial.</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink/60">
                            No charge is taken today. Billing starts only after the trial ends, and
                            you can cancel any time before then.
                        </p>
                    </div>

                    <div className="mt-5">
                        <Button disabled className="w-full">Add payment details</Button>
                        <p className="mt-2 text-center text-xs text-ink/45">
                            Card capture (Paystack) is enabled shortly. Your trial is already active.
                        </p>
                    </div>
                </section>

                <p className="mt-8 text-center text-sm text-ink/60">
                    <a href="/login" className="text-navy hover:underline">Sign in to your workspace</a>
                </p>
            </main>
        </div>
    )
}

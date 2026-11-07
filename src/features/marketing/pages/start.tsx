import { useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon, CheckIcon } from '@phosphor-icons/react'
import { Brand } from '../components/site-header'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { Accordion } from '@/shared/ui/accordion'
import { PlanQuickStart } from '../components/plan-quick-start'
import { PROVINCE_ADDON_CENTS } from '@/features/billing/pricing'
import './start.css'

/**
 * The plan decision, and the two things a buyer wants answered before they
 * commit: what happens after I press this, and what am I agreeing to. Both are
 * real — the steps are the registration flow, the answers are the billing
 * rules — so neither is filler.
 */
const STEPS = [
    { title: 'Create your account', detail: 'Email and a password. No card at this step.' },
    { title: 'Tell us where you work', detail: 'Your provinces and the categories that fit your business.' },
    { title: 'Start the 7-day trial', detail: 'Everything unlocked. Change plan or cancel before it ends.' },
]

const QUESTIONS = [
    {
        id: 'after-trial',
        title: 'What happens when the trial ends?',
        content: (
            <p>
                The plan you chose continues at its monthly price, billed in ZAR. Cancel before the
                trial ends and nothing is charged.
            </p>
        ),
    },
    {
        id: 'change-plan',
        title: 'Can I change plan later?',
        content: (
            <p>
                Yes. Billing shows your current plan and coverage, and you can move between Starter,
                Growth and Pro there.
            </p>
        ),
    },
    {
        id: 'more-provinces',
        title: 'What if I need more provinces?',
        content: (
            <p>
                Add them for R{PROVINCE_ADDON_CENTS / 100} a month each, within your plan&rsquo;s limit.
                Choose them during setup and change them whenever your work moves.
            </p>
        ),
    },
]

export function StartPage() {
    const [params] = useSearchParams()
    const value = params.get('tier')
    const tier = value === 'mid' || value === 'all' ? value : 'single'

    return (
        <div className="marketing-page reference-site start-page">
            <a className="market-skip" href="#main-content">
                Skip to content
            </a>
            <header className="container start-header">
                <a href="/" aria-label="Bidscope home">
                    <Brand />
                </a>
                <div>
                    <ThemeToggle />
                    <a href="/">
                        <ArrowLeftIcon size={17} aria-hidden="true" /> Home
                    </a>
                </div>
            </header>
            <main id="main-content">
                <PlanQuickStart entry initialTier={tier} />

                <section className="container start-support" aria-label="Before you start">
                    <div className="start-next">
                        <h2>What happens next</h2>
                        <ol>
                            {STEPS.map((step, index) => (
                                <li key={step.title}>
                                    <span className="start-step" aria-hidden="true">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3>{step.title}</h3>
                                        <p>{step.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <p className="start-promise">
                            <CheckIcon size={15} aria-hidden="true" />
                            No card for the trial. Cancel anytime.
                        </p>
                    </div>

                    <div className="start-questions">
                        <h2>Common questions</h2>
                        <Accordion items={QUESTIONS} />
                    </div>
                </section>
            </main>
        </div>
    )
}

import {
    ArrowRightIcon,
    RocketLaunchIcon,
    StackIcon,
    ShieldCheckIcon,
    HeadsetIcon,
    MagnifyingGlassIcon,
    ChatCircleDotsIcon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Accordion } from '@/shared/ui/accordion'
import { PublicShell, ReferenceCta, WaveDivider } from '../components/reference-layout'
import { INCLUDED_PROVINCES, TIER_CENTS, TIER_NAMES } from '@/features/billing/pricing'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'

const groups = [
    {
        title: 'Getting started',
        items: [
            {
                question: 'Can I look around before creating an account?',
                answer: (
                    <>
                        Yes. The <a href="/preview">public workspace preview</a> lets you explore with demonstration
                        data. It is a preview, not your own saved workspace.
                    </>
                ),
            },
            {
                question: 'How does tender matching work?',
                answer: (
                    <>
                        Your business profile, services and selected provinces help identify relevant opportunities.
                        Matches are a starting point for review, not a guarantee of eligibility or an award.
                    </>
                ),
            },
            {
                question: 'Does Bidscope submit my tender?',
                answer: (
                    <>
                        No. Bidscope helps you discover and organise opportunities. Prepare and submit your bid directly
                        through the process specified by the publishing buyer.
                    </>
                ),
            },
        ],
    },
    {
        title: 'Plans and coverage',
        items: [
            {
                question: 'What are the base monthly prices?',
                answer: (
                    <>
                        {TIER_NAMES.single} starts at R{TIER_CENTS.single / 100} for {INCLUDED_PROVINCES.single}{' '}
                        province, {TIER_NAMES.mid} at R{TIER_CENTS.mid / 100} for {INCLUDED_PROVINCES.mid} provinces,
                        and {TIER_NAMES.all} at R{TIER_CENTS.all / 100} for all {INCLUDED_PROVINCES.all}. See{' '}
                        <a href="/pricing">pricing</a> for annual billing, available offers and province add-ons.
                    </>
                ),
            },
            {
                question: 'Which plans include saved tenders and the calendar?',
                answer: (
                    <>
                        Bookmarks and the deadline calendar are included with Growth and Pro. Starter focuses on tender
                        discovery. Compare the full feature list on the pricing page before choosing a plan.
                    </>
                ),
            },
            {
                question: 'Does coverage include every South African tender?',
                answer: (
                    <>
                        No. Bidscope draws from national publishing channels and selected direct sources. Availability
                        varies, and not every buyer is covered. Our <a href="/coverage">coverage page</a> explains the
                        source landscape and its limits.
                    </>
                ),
            },
        ],
    },
    {
        title: 'Working with notices',
        items: [
            {
                question: 'Where should I check documents and amendments?',
                answer: (
                    <>
                        Use the source links and available documents on the tender detail page. Always verify the latest
                        requirements, amendments and closing dates with the original publisher before submitting.
                    </>
                ),
            },
            {
                question: 'Who should I contact about a tender requirement?',
                answer: (
                    <>
                        Contact the buyer using the details in the official notice. For questions about Bidscope or your
                        account, <a href="/contact">contact our support team</a>.
                    </>
                ),
            },
        ],
    },
]

const topicIcons = [RocketLaunchIcon, StackIcon, HeadsetIcon]
export function FaqPage() {
    const [query, setQuery] = useState('')
    const [topic, setTopic] = useState(0)
    const answers = useSubtleReveal<HTMLDivElement>(topic, {
        duration: 0.26,
        x: 10,
        stagger: 0.025,
        selector: '.ds-accordion-item',
    })
    const normalized = query.trim().toLowerCase()
    const visible = groups
        .map((group, index) => ({
            ...group,
            index,
            items: group.items.filter((item) => !normalized || item.question.toLowerCase().includes(normalized)),
        }))
        .filter((group) => group.items.length && (normalized || group.index === topic))
    const count = visible.reduce((total, group) => total + group.items.length, 0)
    return (
        <PublicShell>
            <section className="ref-faq-hero">
                <div className="container">
                    <h1>Frequently asked questions</h1>
                    <p>
                        Find quick answers about Bidscope, your account, plans and how to get the most from your
                        workspace.
                    </p>
                    <div className="ref-faq-search">
                        <MagnifyingGlassIcon size={25} />
                        <label className="sr-only" htmlFor="faq-search">
                            Search FAQs
                        </label>
                        <input
                            id="faq-search"
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search for a question or topic..."
                        />
                    </div>
                    <p className="ref-search-status" role="status">
                        {normalized ? count + ' matching questions' : ''}
                    </p>
                </div>
                <WaveDivider />
            </section>
            <div className="container ref-faq-layout">
                <aside className="ref-faq-topics" aria-label="FAQ topics">
                    {groups.map((group, index) => {
                        const Icon = topicIcons[index] ?? ShieldCheckIcon
                        return (
                            <button
                                key={group.title}
                                aria-pressed={topic === index && !normalized}
                                onClick={() => {
                                    setTopic(index)
                                    setQuery('')
                                }}
                            >
                                <Icon size={27} />
                                {group.title}
                                <ArrowRightIcon size={16} />
                            </button>
                        )
                    })}
                    <a href="/contact">
                        <HeadsetIcon size={27} />
                        Support
                        <ArrowRightIcon size={16} />
                    </a>
                </aside>
                <div className="ref-faq-answers" ref={answers}>
                    {visible.map((group) => (
                        <section key={group.title}>
                            <h2 className="sr-only">{group.title}</h2>
                            <Accordion
                                items={group.items.map((item, index) => ({
                                    id: String(index),
                                    title: item.question,
                                    content: <p>{item.answer}</p>,
                                }))}
                            />
                        </section>
                    ))}
                    {count === 0 && (
                        <div className="ref-faq-empty">
                            <h2>No answers found</h2>
                            <p>Try another word, or contact our support team.</p>
                            <button className="bs-button outline" onClick={() => setQuery('')}>
                                Clear search
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <section className="container ref-help">
                <span className="ref-icon">
                    <ChatCircleDotsIcon size={43} />
                </span>
                <div>
                    <h2>Still have a question?</h2>
                    <p>Can’t find what you’re looking for? Get in touch with our team.</p>
                </div>
                <a className="bs-button outline" href="/contact">
                    Contact support <ArrowRightIcon size={18} />
                </a>
            </section>
            <ReferenceCta />
        </PublicShell>
    )
}

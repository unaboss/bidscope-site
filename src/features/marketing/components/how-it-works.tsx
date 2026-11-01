import { ArrowRightIcon as ArrowRight, BellIcon as Bell, ListChecksIcon as ListTodo, MagnifyingGlassIcon as Search } from '@phosphor-icons/react'

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="how-section container">
            <h2>Build a clearer tender shortlist</h2>
            <div className="steps-grid">
                {[
                    {
                        icon: Search,
                        title: '1. Set your profile',
                        copy: (
                            <>
                                Tell us what you do and
                                <br />
                                where you work.
                            </>
                        ),
                    },
                    {
                        icon: ListTodo,
                        title: '2. Get matched',
                        copy: (
                            <>
                                We find and rank relevant
                                <br />
                                tenders for you.
                            </>
                        ),
                    },
                    {
                        icon: Bell,
                        title: '3. Stay on track',
                        copy: (
                            <>
                                Save and track deadlines
                                <br />
                                on Growth and Pro.
                            </>
                        ),
                    },
                ].map(({ icon: Icon, title, copy }, index) => (
                    <article className="how-step" key={title}>
                        <span className="feature-icon">
                            <Icon size={29} weight="regular" />
                        </span>
                        <h3>{title}</h3>
                        <p>{copy}</p>
                        {index < 2 && <ArrowRight className="step-arrow" size={30} weight="regular" />}
                    </article>
                ))}
            </div>
        </section>
    )
}

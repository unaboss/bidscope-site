import { ArrowRight, Bell, ListTodo, Search } from 'lucide-react'

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="how-section container">
            <h2>Get from search to submission</h2>
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
                                Get alerts and never
                                <br />
                                miss a deadline.
                            </>
                        ),
                    },
                ].map(({ icon: Icon, title, copy }, index) => (
                    <article className="how-step" key={title}>
                        <span className="feature-icon">
                            <Icon size={29} strokeWidth={1.6} />
                        </span>
                        <h3>{title}</h3>
                        <p>{copy}</p>
                        {index < 2 && <ArrowRight className="step-arrow" size={30} strokeWidth={1} />}
                    </article>
                ))}
            </div>
        </section>
    )
}

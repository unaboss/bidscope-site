export function CoverageSection() {
    return (
        <section id="coverage" className="coverage-section">
            <div className="container coverage-inner">
                <div className="coverage-map">
                    <img src="/images/south-africa.svg" alt="Map of South Africa showing nationwide coverage" />
                </div>
                <div className="coverage-copy">
                    <h2>South Africa coverage</h2>
                    <div className="coverage-stats">
                        {[
                            ['9', 'Provinces'],
                            ['134', 'Municipalities'],
                            ['430+', 'Organisations'],
                            ['30+', 'Clients'],
                        ].map(([n, label]) => (
                            <div key={label}>
                                <strong>{n}</strong>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

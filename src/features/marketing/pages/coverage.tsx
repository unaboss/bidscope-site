import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    BankIcon,
    BuildingsIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    XIcon,
} from '@phosphor-icons/react'
import { PublicShell } from '../components/reference-layout'
import { Button } from '@/shared/ui/button'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'
import { ProvinceMap } from '../coverage/province-map'
import {
    COVERAGE_PROVINCES,
    LOCAL_SOURCES,
    OTHER_PUBLISHERS,
    provinceById,
    sourcesForProvince,
} from '../coverage/coverage-directory'
import type { CoverageSource, ProvinceId } from '../coverage/coverage-directory'
import '../coverage/coverage.css'

function SourceRow({ source }: { readonly source: CoverageSource }) {
    const Icon = source.province ? BuildingsIcon : BankIcon
    return (
        <li className="coverage-source-row">
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={'Open ' + source.name + ' procurement website (opens in new tab)'}
            >
                <Icon size={22} aria-hidden="true" />
                <span>
                    <strong>{source.name}</strong>
                    <span>{source.description}</span>
                    <small>{source.kind}</small>
                </span>
                <ArrowUpRightIcon size={19} aria-hidden="true" />
            </a>
        </li>
    )
}

export function CoveragePage() {
    const [params, setParams] = useSearchParams()
    const province = provinceById(params.get('province'))
    const [query, setQuery] = useState('')
    const sources = sourcesForProvince(province.id, query)
    const hasLocal = LOCAL_SOURCES.some((source) => source.province === province.id)
    const noResults = sources.local.length + sources.national.length === 0
    const ledger = useSubtleReveal<HTMLDivElement>(province.id, { duration: 0.24, x: 8 })

    function selectProvince(id: ProvinceId) {
        if (id === province.id) return
        setParams(
            (current) => {
                current.set('province', id)
                return current
            },
            { preventScrollReset: true },
        )
    }

    return (
        <PublicShell>
            <div className="container coverage-page">
                <header className="coverage-heading ref-hero-copy">
                    <p className="coverage-page-label">
                        <MapPinIcon size={17} />
                        Coverage explorer
                    </p>
                    <h1>
                        Follow the sources.
                        <br className="coverage-mobile-break" /> Find your province.
                    </h1>
                    <p>Explore the publishing channels behind procurement opportunities across South Africa.</p>
                </header>

                <section className="coverage-explorer" aria-label="Explore procurement sources by province">
                    <div className="coverage-geography">
                        <div className="coverage-mobile-picker">
                            <label htmlFor="coverage-province">Choose a province</label>
                            <select
                                id="coverage-province"
                                value={province.id}
                                onChange={(event) => selectProvince(event.target.value as ProvinceId)}
                            >
                                {COVERAGE_PROVINCES.map(({ id, name }) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ProvinceMap selected={province.id} onSelect={selectProvince} />
                        <div className="coverage-province-choices" role="group" aria-label="Choose a province">
                            {COVERAGE_PROVINCES.map(({ id, name }) => (
                                <button
                                    key={id}
                                    type="button"
                                    aria-pressed={province.id === id}
                                    aria-controls="coverage-source-ledger"
                                    onClick={() => selectProvince(id)}
                                >
                                    <span>{id}</span>
                                    <span>{name}</span>
                                    {province.id === id && <CheckIcon size={17} aria-hidden="true" />}
                                </button>
                            ))}
                        </div>
                        <details className="coverage-attribution">
                            <summary>About the map</summary>
                            <p>
                                Mainland provincial boundaries: geoBoundaries, from OCHA ROSEA and the South African
                                Municipal Demarcation Board (2020). Simplified for this overview; not a legal boundary
                                reference.
                            </p>
                            <a
                                href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Boundary data &amp; provenance <ArrowUpRightIcon size={14} />
                            </a>
                            <a
                                href="https://creativecommons.org/licenses/by/3.0/igo/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                CC BY 3.0 IGO licence <ArrowUpRightIcon size={14} />
                            </a>
                        </details>
                    </div>

                    <section
                        className="coverage-ledger"
                        id="coverage-source-ledger"
                        aria-labelledby="coverage-province-name"
                    >
                        <div className="coverage-ledger-heading">
                            <span>Exploring</span>
                            <h2 id="coverage-province-name">{province.name}</h2>
                            <p>Recognised sources, with links to the original publisher.</p>
                        </div>
                        <p className="sr-only" role="status">
                            Showing {province.name}.{' '}
                            {hasLocal
                                ? 'Direct local publishers and national channels listed.'
                                : 'National channels listed. No direct local publisher listed in this directory.'}
                        </p>
                        <div className="coverage-source-search">
                            <MagnifyingGlassIcon size={19} aria-hidden="true" />
                            <label className="sr-only" htmlFor="coverage-search">
                                Search sources in this province view
                            </label>
                            <input
                                id="coverage-search"
                                type="search"
                                placeholder="Find a source…"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                            {query && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Clear source search"
                                    onClick={() => setQuery('')}
                                >
                                    <XIcon size={17} />
                                </Button>
                            )}
                        </div>
                        <div className="coverage-source-results" ref={ledger}>
                            {noResults ? (
                                <div className="coverage-empty" role="status">
                                    <h3>No matching sources</h3>
                                    <p>
                                        Try another name, or clear the search to see this province’s source directory.
                                    </p>
                                    <Button variant="secondary" onClick={() => setQuery('')}>
                                        Clear search
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {(!query.trim() || sources.local.length > 0) && (
                                        <section className="coverage-source-group" aria-label="Direct local publishers">
                                            <h3>Direct local publishers</h3>
                                            {sources.local.length > 0 ? (
                                                <ul>
                                                    {sources.local.map((source) => (
                                                        <SourceRow key={source.key} source={source} />
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="coverage-local-empty">
                                                    <span>No direct local publisher listed yet.</span>
                                                    <p>
                                                        Notices for {province.name} may still appear through national
                                                        publishing channels below.
                                                    </p>
                                                </div>
                                            )}
                                        </section>
                                    )}
                                    {sources.national.length > 0 && (
                                        <section className="coverage-source-group" aria-label="National channels">
                                            <h3>
                                                National channels <span>Across provinces</span>
                                            </h3>
                                            <ul>
                                                {sources.national.map((source) => (
                                                    <SourceRow key={source.key} source={source} />
                                                ))}
                                            </ul>
                                            <p className="coverage-source-footnote">
                                                A national channel can publish notices for this province. It is not a
                                                guarantee of complete provincial coverage.
                                            </p>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="coverage-ledger-note">
                            <span className="coverage-status-dot" />
                            <p>This is a source directory, not a live feed or source-health status.</p>
                        </div>
                    </section>
                </section>

                <section className="coverage-context" aria-label="Coverage details">
                    <div>
                        <h2>Coverage follows the publisher.</h2>
                        <p>
                            Bidscope brings together notices from national channels and selected direct sources. Not
                            every municipality or buyer is covered directly. Notices can change or be withdrawn; always
                            check the original documents.
                        </p>
                    </div>
                    <details className="coverage-other-sources">
                        <summary>
                            Other recognised public-entity publishers{' '}
                            <span>
                                <ArrowRightIcon size={18} />
                            </span>
                        </summary>
                        <p>
                            These publishers are also recognised by Bidscope. This directory does not assign their
                            notices to a province.
                        </p>
                        <ul>
                            {OTHER_PUBLISHERS.map((source) => (
                                <li key={source.key}>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        {source.name}
                                        <ArrowUpRightIcon size={15} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </details>
                </section>
                <div className="coverage-next">
                    <span>Choose the reach that fits your business.</span>
                    <a href="/pricing">
                        Compare province plans <ArrowRightIcon size={18} />
                    </a>
                </div>
            </div>
        </PublicShell>
    )
}

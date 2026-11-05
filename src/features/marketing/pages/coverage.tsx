import { useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    BankIcon,
    BuildingsIcon,
    MagnifyingGlassIcon,
    XIcon,
} from '@phosphor-icons/react'
import { PublicShell } from '../components/reference-layout'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'
import { ProvinceMap } from '../coverage/province-map'
import { COVERAGE_PROVINCES, OTHER_PUBLISHERS, provinceById, sourcesForProvince } from '../coverage/coverage-directory'
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
                title={source.description}
                aria-label={'Open ' + source.name + ' procurement website (opens in new tab)'}
            >
                <Icon size={22} aria-hidden="true" />
                <span>
                    <strong>{source.name}</strong>
                    <small>
                        {source.key === 'etenders'
                            ? 'Government tender notice portal'
                            : source.key === 'ocds'
                              ? 'Government procurement data'
                              : source.description}
                    </small>
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
    const [pickerOpen, setPickerOpen] = useState(false)
    useLayoutEffect(() => {
        if (!pickerOpen) return
        const root = document.getElementById('root')
        if (!root) return
        // Radix portals the menu outside the app. Keep its aria-hidden background unfocusable too.
        const previous = root.inert
        root.inert = true
        return () => {
            root.inert = previous
        }
    }, [pickerOpen])
    const sources = sourcesForProvince(province.id, query)
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
                    <h1>Procurement coverage</h1>
                    <p>Choose a province to find tender publishers and open their original notices.</p>
                </header>

                <section className="coverage-explorer" aria-label="Explore procurement sources by province">
                    <div className="coverage-geography">
                        <div className="coverage-picker">
                            <label htmlFor="coverage-province">Choose a province</label>
                            <Select
                                open={pickerOpen}
                                onOpenChange={setPickerOpen}
                                value={province.id}
                                onValueChange={(id) => selectProvince(id as ProvinceId)}
                            >
                                <SelectTrigger
                                    id="coverage-province"
                                    aria-label="Choose a province"
                                    className="coverage-province-trigger"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="coverage-province-menu" sideOffset={6} position="popper">
                                    {COVERAGE_PROVINCES.map(({ id, name }) => (
                                        <SelectItem key={id} value={id}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <ProvinceMap selected={province.id} onSelect={selectProvince} />
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
                            <span>Tender sources</span>
                            <h2 id="coverage-province-name">{province.name}</h2>
                        </div>
                        <p className="sr-only" role="status">
                            Showing sources for {province.name}.
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
                                            <h3>Local to this province</h3>
                                            {sources.local.length > 0 ? (
                                                <ul>
                                                    {sources.local.map((source) => (
                                                        <SourceRow key={source.key} source={source} />
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="coverage-local-empty">
                                                    <span>No local publisher listed for {province.name}.</span>
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
                                            <h3>National portals</h3>
                                            <p className="coverage-channel-context">
                                                May include notices for {province.name}.
                                            </p>
                                            <ul>
                                                {sources.national.map((source) => (
                                                    <SourceRow key={source.key} source={source} />
                                                ))}
                                            </ul>
                                            <p className="coverage-source-footnote">
                                                Coverage varies by publisher. Always check the original notice.
                                            </p>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </section>

                <section className="coverage-context" aria-label="Coverage details">
                    <div>
                        <h2>What this directory covers</h2>
                        <p>
                            Bidscope brings together notices from national channels and selected direct sources. Not
                            every municipality or buyer is covered directly. Notices can change or be withdrawn; always
                            check the original documents.
                        </p>
                    </div>
                    <details className="coverage-other-sources">
                        <summary>
                            Other public-entity publishers{' '}
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

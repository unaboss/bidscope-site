import { useEffect, useId, useRef, useState } from 'react'
import { ArrowClockwiseIcon, ArrowDownIcon, MapTrifoldIcon } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/button'
import { adjacentProvince, COVERAGE_PROVINCES, isCoverageGeometry } from './coverage-directory'
import type { CoverageGeometry, ProvinceId } from './coverage-directory'

export function ProvinceMap({
    selected,
    onSelect,
}: {
    readonly selected: ProvinceId
    readonly onSelect: (id: ProvinceId) => void
}) {
    const [geometry, setGeometry] = useState<CoverageGeometry | null>(null)
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const [hovered, setHovered] = useState<ProvinceId | null>(null)
    const [focused, setFocused] = useState<ProvinceId>(selected)
    const map = useRef<SVGSVGElement>(null)
    const hint = useId()
    useEffect(() => setFocused(selected), [selected])

    useEffect(() => {
        const controller = new AbortController()
        setFailed(false)
        void fetch('/maps/coverage-provinces.json', { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error('Map unavailable')
                const data: unknown = await response.json()
                if (!isCoverageGeometry(data)) throw new Error('Invalid boundaries')
                setGeometry(data)
            })
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true)
            })
        return () => controller.abort()
    }, [attempt])

    return (
        <div className="coverage-map-area">
            <div className="coverage-map-topline">
                <span>South Africa</span>
                <span>Province boundaries</span>
            </div>
            <div className="coverage-map-canvas" aria-busy={!geometry && !failed}>
                {geometry ? (
                    <svg
                        ref={map}
                        viewBox={geometry.viewBox}
                        role="group"
                        aria-label="Interactive map of South Africa’s provinces"
                        aria-describedby={hint}
                    >
                        {geometry.provinces.map((province) => {
                            const name = COVERAGE_PROVINCES.find(({ id }) => id === province.id)!.name
                            return (
                                <path
                                    key={province.id}
                                    d={province.path}
                                    fillRule="evenodd"
                                    role="button"
                                    aria-label={`Select ${name} on map`}
                                    aria-pressed={selected === province.id}
                                    tabIndex={focused === province.id ? 0 : -1}
                                    data-province={province.id}
                                    data-active={selected === province.id}
                                    data-hovered={hovered === province.id}
                                    aria-controls="coverage-source-ledger"
                                    onClick={() => onSelect(province.id)}
                                    onPointerEnter={() => setHovered(province.id)}
                                    onPointerLeave={() => setHovered(null)}
                                    onFocus={() => {
                                        setHovered(province.id)
                                        setFocused(province.id)
                                    }}
                                    onBlur={() => setHovered(null)}
                                    onKeyDown={(event) => {
                                        if (event.altKey || event.ctrlKey || event.metaKey) return
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            onSelect(province.id)
                                        } else if (event.key.startsWith('Arrow')) {
                                            event.preventDefault()
                                            const next = adjacentProvince(geometry, province.id, event.key)
                                            map.current
                                                ?.querySelector<SVGPathElement>(`[data-province="${next}"]`)
                                                ?.focus()
                                        }
                                    }}
                                >
                                    <title>{name}</title>
                                </path>
                            )
                        })}
                        {geometry.provinces.map((province) => (
                            <text
                                key={province.id}
                                x={province.label[0]}
                                y={province.label[1]}
                                aria-hidden="true"
                                data-active={selected === province.id}
                            >
                                {province.id}
                            </text>
                        ))}
                    </svg>
                ) : (
                    <div className="coverage-map-fallback" role="status">
                        <MapTrifoldIcon size={34} />
                        <p>{failed ? 'The province map couldn’t load.' : 'Loading province boundaries…'}</p>
                        {failed && (
                            <>
                                <span>You can still explore every province using the province selector.</span>
                                <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>
                                    <ArrowClockwiseIcon size={17} />
                                    Retry map
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="coverage-map-legend">
                <span>
                    <i />
                    Selected province
                </span>
                <span className="coverage-map-hover-name">
                    {hovered
                        ? COVERAGE_PROVINCES.find(({ id }) => id === hovered)!.name
                        : 'Choose a province to explore'}
                </span>
                <a
                    className="coverage-map-jump"
                    href="#coverage-source-ledger"
                    aria-label={'View sources for ' + COVERAGE_PROVINCES.find(({ id }) => id === selected)!.name}
                >
                    View sources <ArrowDownIcon size={13} />
                </a>
            </div>
            <p className="sr-only" id={hint}>
                Use arrow keys to focus a province, then Enter or Space to select it. The province choices provide the
                same functionality.
            </p>
        </div>
    )
}

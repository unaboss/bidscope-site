import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import './tender-map.css'
import { MinusIcon as Minus, PlusIcon as Plus, ScanIcon as Scan } from '@phosphor-icons/react'
import { estimateFrom, estimateText } from '@/features/tenders/estimate'
import { daysUntil, formatDate, relativeDays } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import type { MapPrecision, TenderMapPoint } from '@/shared/types'
import geography from './south-africa.json'

/** Mainland South Africa, the view the map opens on and resets to. */
const SOUTH_AFRICA: L.LatLngBoundsExpression = [[-34.9, 16.4], [-22.1, 32.95]]

/** How far the map may be dragged away from the country before it pulls back. */
const LIMITS: L.LatLngBoundsExpression = [[-40, 8], [-15, 40]]

const MAX_ZOOM = 13

/** Town labels by Natural Earth scale rank, revealed as the map zooms in. */
const TOWN_RANK_AT_ZOOM: ReadonlyArray<readonly [number, number]> = [[7.25, 10], [6.5, 6], [6, 4], [5.75, 3], [0, 2]]

/** Province names fade out once towns take over. */
const PROVINCE_LABELS_BELOW_ZOOM = 7

const PROVINCE_LABELS: ReadonlyArray<readonly [string, number, number]> = [
    ['Northern Cape', -29.9, 21.0],
    ['Western Cape', -32.45, 19.9],
    ['Eastern Cape', -31.9, 25.6],
    ['Free State', -28.2, 27.0],
    ['KwaZulu-Natal', -28.75, 30.75],
    ['North West', -26.95, 24.9],
    ['Mpumalanga', -26.3, 30.15],
    ['Limpopo', -23.2, 28.6],
]

const NEIGHBOUR_LABELS: ReadonlyArray<readonly [string, number, number]> = [
    ['Namibia', -24.2, 17.4],
    ['Botswana', -23.4, 24.1],
    ['Zimbabwe', -21.0, 30.2],
    ['Mozambique', -23.4, 33.4],
    ['Lesotho', -29.55, 28.25],
    ['Eswatini', -26.55, 31.5],
]

const PRECISION_COPY: Record<MapPrecision, string> = {
    site: 'Site named in the tender',
    town: 'Town named in the tender',
    municipality: 'Municipality named in the tender',
    buyer: "Buyer's town, no site named",
    province: 'Province only, not yet placed',
}

type PinKind = 'exact' | 'buyer' | 'province'

function pinKind(precision: MapPrecision): PinKind
{
    if (precision === 'buyer') {
        return 'buyer'
    }

    return precision === 'province' ? 'province' : 'exact'
}

function pinIcon(point: TenderMapPoint, active: boolean): L.DivIcon
{
    return L.divIcon({
        className: cn('bs-pin', `bs-pin--${pinKind(point.precision)}`, point.relevant && 'bs-pin--relevant', active && 'bs-pin--active'),
        html: '<span class="bs-pin__dot"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -10],
    })
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon
{
    const count = cluster.getChildCount()
    const size = count < 10 ? 34 : count < 50 ? 42 : 52

    return L.divIcon({
        className: 'bs-cluster',
        html: `<span class="bs-cluster__ring"><span class="bs-cluster__count">${count}</span></span>`,
        iconSize: [size, size],
    })
}

/** A text node inside a new element: tender text comes from outside sources, so never as HTML. */
function el(tag: string, className: string, text?: string): HTMLElement
{
    const node = document.createElement(tag)
    node.className = className

    if (text !== undefined) {
        node.textContent = text
    }

    return node
}

function popupFor(point: TenderMapPoint, onOpen: (id: string) => void): HTMLElement
{
    const root = el('div', 'bs-popup')
    root.appendChild(el('span', 'bs-popup__eyebrow', PRECISION_COPY[point.precision]))
    root.appendChild(el('strong', 'bs-popup__title', point.title ?? 'Untitled tender'))

    if (point.organ !== null) {
        root.appendChild(el('span', 'bs-popup__organ', point.organ))
    }

    const facts = el('dl', 'bs-popup__facts')
    const fact = (label: string, value: string): void =>
    {
        const row = el('div', 'bs-popup__fact')
        row.appendChild(el('dt', '', label))
        row.appendChild(el('dd', '', value))
        facts.appendChild(row)
    }

    fact('Where', point.place)
    fact('Closes', point.closingDate !== null
        ? `${formatDate(point.closingDate)} · ${relativeDays(daysUntil(point.closingDate))}`
        : 'Not published')

    const estimate = estimateFrom(point)

    if (estimate !== null) {
        fact('Est. value', estimateText(estimate, true))
    }

    root.appendChild(facts)

    const open = el('a', 'bs-popup__open', 'Open tender →') as HTMLAnchorElement
    open.href = `/tenders/${encodeURIComponent(point.id)}`
    open.addEventListener('click', (event) =>
    {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
            return
        }

        event.preventDefault()
        onOpen(point.id)
    })
    root.appendChild(open)

    return root
}

function label(text: string, lat: number, lng: number, className: string, pane: string): L.Marker
{
    return L.marker([lat, lng], {
        pane,
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className, html: `<span>${text}</span>`, iconSize: [0, 0] }),
    })
}

export interface TenderMapProps
{
    readonly points: readonly TenderMapPoint[]
    /** Matching tenders that could not be placed, e.g. national ones. */
    readonly unplaced: number
    readonly loading: boolean
    /** A province filter: the map flies to it, and back out to the whole country when cleared. */
    readonly province?: string
    readonly onOpen: (id: string) => void
    /**
     * `compact` is the map alone, with no count, key or credit, for pages where it is one
     * section of several. It fills its container's height, so the page decides how tall it is.
     */
    readonly size?: 'full' | 'compact'
    readonly className?: string
}

/**
 * South Africa with a pin for every open tender in view. Drawn from bundled
 * Natural Earth shapes rather than map tiles, so it matches the theme, loads with
 * the app and never depends on a tile server. Pins that share a place gather into
 * numbered clusters that split apart as you zoom in.
 */
export default function TenderMap({ points, unplaced, loading, province = '', onOpen, size = 'full', className }: TenderMapProps): ReactElement
{
    const container = useRef<HTMLDivElement>(null)
    const map = useRef<L.Map | null>(null)
    const cluster = useRef<L.MarkerClusterGroup | null>(null)
    const provinceLayers = useRef(new Map<string, L.Polygon>())
    const openRef = useRef(onOpen)
    const [zoom, setZoom] = useState(5)
    openRef.current = onOpen

    const perProvince = useMemo(() =>
    {
        const counts = new Map<string, number>()

        for (const point of points) {
            if (point.province !== null) {
                counts.set(point.province, (counts.get(point.province) ?? 0) + 1)
            }
        }

        return counts
    }, [points])

    const countsRef = useRef(perProvince)
    countsRef.current = perProvince

    // The base map: built once, torn down with the component.
    useEffect(() =>
    {
        if (container.current === null) {
            return
        }

        // On a touch screen one finger scrolls the page and two move the map; a
        // mouse can still drag it. The scroll wheel always scrolls the page.
        const touchFirst = window.matchMedia('(pointer: coarse)').matches
        const instance = L.map(container.current, {
            dragging: !touchFirst,
            zoomControl: false,
            attributionControl: false,
            maxBounds: LIMITS,
            maxBoundsViscosity: 0.8,
            maxZoom: MAX_ZOOM,
            zoomSnap: 0.25,
            zoomDelta: 0.75,
            scrollWheelZoom: false,
            preferCanvas: false,
        })

        instance.fitBounds(SOUTH_AFRICA, { padding: [12, 12] })
        instance.setMinZoom(Math.max(instance.getZoom() - 0.75, 3))

        for (const [name, z] of [['neighbours', 200], ['provinces', 250], ['outline', 300], ['labels', 350]] as const) {
            instance.createPane(name).style.zIndex = String(z)
        }

        L.geoJSON(geography.countries as unknown as GeoJSON.FeatureCollection, {
            pane: 'neighbours',
            interactive: false,
            style: (feature) => ({ className: feature?.properties?.iso === 'ZAF' ? 'bs-land' : 'bs-neighbour' }),
        }).addTo(instance)

        L.geoJSON(geography.provinces as unknown as GeoJSON.FeatureCollection, {
            pane: 'provinces',
            style: () => ({ className: 'bs-province' }),
            onEachFeature: (feature, layer) =>
            {
                const name = String(feature.properties?.name ?? '')
                const path = layer as L.Path

                path.bindTooltip(() =>
                {
                    const count = countsRef.current.get(name) ?? 0

                    return `<strong>${name}</strong><span>${count} open tender${count === 1 ? '' : 's'}</span>`
                }, { sticky: true, direction: 'top', className: 'bs-tooltip', offset: [0, -8] })

                path.on('mouseover', () => path.getElement()?.classList.add('bs-province--hover'))
                path.on('mouseout', () => path.getElement()?.classList.remove('bs-province--hover'))
                provinceLayers.current.set(name, layer as L.Polygon)
            },
        }).addTo(instance)

        L.geoJSON(geography.countries as unknown as GeoJSON.FeatureCollection, {
            pane: 'outline',
            interactive: false,
            filter: (feature) => feature.properties?.iso === 'ZAF',
            style: () => ({ className: 'bs-coast', fill: false }),
        }).addTo(instance)

        const provinceLabels = L.layerGroup(PROVINCE_LABELS.map(([name, lat, lng]) => label(name, lat, lng, 'bs-label bs-label--province', 'labels')))
        const neighbourLabels = L.layerGroup(NEIGHBOUR_LABELS.map(([name, lat, lng]) => label(name, lat, lng, 'bs-label bs-label--neighbour', 'labels')))
        const towns = geography.towns.map((town) => ({
            rank: town.rank,
            marker: L.marker([town.lat, town.lng], {
                pane: 'labels',
                interactive: false,
                keyboard: false,
                icon: L.divIcon({ className: 'bs-town', html: `<i></i><span>${town.name}</span>`, iconSize: [6, 6], iconAnchor: [3, 3] }),
            }),
        }))
        const townLayer = L.layerGroup().addTo(instance)
        neighbourLabels.addTo(instance)

        function relabel(): void
        {
            const current = instance.getZoom()
            const maxRank = TOWN_RANK_AT_ZOOM.find(([atZoom]) => current >= atZoom)?.[1] ?? 3

            for (const town of towns) {
                const show = town.rank <= maxRank

                if (show && !townLayer.hasLayer(town.marker)) {
                    townLayer.addLayer(town.marker)
                } else if (!show && townLayer.hasLayer(town.marker)) {
                    townLayer.removeLayer(town.marker)
                }
            }

            if (current < PROVINCE_LABELS_BELOW_ZOOM) {
                provinceLabels.addTo(instance)
            } else {
                provinceLabels.remove()
            }

            container.current?.classList.toggle('bs-map--far', current < 5.5)
            setZoom(current)
        }

        instance.on('zoomend', relabel)
        relabel()

        const group = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 44,
            spiderfyDistanceMultiplier: 1.4,
            iconCreateFunction: clusterIcon,
            chunkedLoading: true,
        })
        group.addTo(instance)

        map.current = instance
        cluster.current = group

        // The frame can change size without the window resizing (a page that sizes the
        // map to fit the screen). Re-measure, and re-frame the country unless the
        // user has already moved the map.
        let home = { zoom: instance.getZoom(), center: instance.getCenter() }
        const resized = typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(() =>
            {
                const untouched = instance.getZoom() === home.zoom && instance.getCenter().equals(home.center)

                instance.invalidateSize({ pan: false })

                if (untouched) {
                    instance.setMinZoom(3)
                    instance.fitBounds(SOUTH_AFRICA, { padding: [12, 12], animate: false })
                    instance.setMinZoom(Math.max(instance.getZoom() - 0.75, 3))
                    home = { zoom: instance.getZoom(), center: instance.getCenter() }
                }
            })
        resized?.observe(container.current)

        return () =>
        {
            resized?.disconnect()
            instance.remove()
            map.current = null
            cluster.current = null
            provinceLayers.current.clear()
        }
    }, [])

    // The pins: rebuilt whenever the filtered set changes.
    useEffect(() =>
    {
        const group = cluster.current

        if (group === null) {
            return
        }

        group.clearLayers()

        const layers = points.map((point) =>
        {
            const marker = L.marker([point.lat, point.lng], {
                icon: pinIcon(point, false),
                title: point.title ?? 'Untitled tender',
                alt: point.title ?? 'Untitled tender',
                riseOnHover: true,
            })

            marker.bindPopup(() => popupFor(point, (id) => openRef.current(id)), {
                className: 'bs-popup-shell',
                maxWidth: 300,
                minWidth: 260,
                autoPanPadding: [24, 24],
            })
            marker.on('popupopen', () => marker.setIcon(pinIcon(point, true)))
            marker.on('popupclose', () => marker.setIcon(pinIcon(point, false)))

            return marker
        })

        group.addLayers(layers)
    }, [points])

    // Follow the province filter in and back out.
    const firstProvince = useRef(true)

    useEffect(() =>
    {
        const instance = map.current

        if (instance === null) {
            return
        }

        if (firstProvince.current && province === '') {
            firstProvince.current = false

            return
        }

        firstProvince.current = false
        instance.closePopup()

        for (const [name, path] of provinceLayers.current) {
            path.getElement()?.classList.toggle('bs-province--selected', name === province)
            path.getElement()?.classList.toggle('bs-province--muted', province !== '' && name !== province)
        }

        const layer = provinceLayers.current.get(province)

        if (layer !== undefined) {
            instance.flyToBounds(layer.getBounds(), { padding: [24, 24], duration: 0.6 })
        } else {
            instance.flyToBounds(SOUTH_AFRICA, { padding: [12, 12], duration: 0.6 })
        }
    }, [province])

    function reset(): void
    {
        map.current?.closePopup()
        map.current?.flyToBounds(SOUTH_AFRICA, { padding: [12, 12], duration: 0.6 })
    }

    const placed = points.length

    return (
        <section aria-label="Tender map" className={cn('flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel', size === 'compact' && 'h-full', className)}>
            {size === 'full' && (
                <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-3">
                    <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-serif text-xl font-semibold leading-none text-ink tabular-nums">{loading ? '…' : placed}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55">open tenders on the map</span>
                        {!loading && unplaced > 0 && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/35">
                                · {unplaced} national, no single site
                            </span>
                        )}
                    </p>

                    <ul aria-label="Map key" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <li className="bs-legend"><i className="bs-legend__dot bs-legend__dot--exact" />Site or town</li>
                        <li className="bs-legend"><i className="bs-legend__dot bs-legend__dot--buyer" />Buyer&apos;s town</li>
                        <li className="bs-legend"><i className="bs-legend__dot bs-legend__dot--province" />Province only</li>
                        <li className="bs-legend"><i className="bs-legend__dot bs-legend__dot--relevant" />Relevant to you</li>
                    </ul>
                </header>
            )}

            <div className={cn('bs-map-frame relative isolate', size === 'compact' && 'bs-map-frame--compact')}>
                <div ref={container} role="region" aria-label="Map of open tenders in South Africa" className="bs-map absolute inset-0" />

                <div className="absolute end-3 top-3 z-[500] flex flex-col overflow-hidden rounded-xl border border-line/80 bg-night/80 backdrop-blur-sm">
                    <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => map.current?.zoomIn()} className="bs-map-button">
                        <Plus className="size-4" />
                    </button>
                    <button type="button" aria-label="Zoom out" onClick={() => map.current?.zoomOut()} className="bs-map-button border-t border-line/80">
                        <Minus className="size-4" />
                    </button>
                    <button type="button" aria-label="Show all of South Africa" onClick={reset} className="bs-map-button border-t border-line/80">
                        <Scan className="size-4" />
                    </button>
                </div>

                {size === 'full' && (
                    <span className="pointer-events-none absolute bottom-2 end-3 z-[500] font-mono text-[9px] uppercase tracking-[0.12em] text-ink/30">
                        Boundaries: Natural Earth
                    </span>
                )}

                {loading && <div aria-hidden="true" className="bs-map-loading absolute inset-x-0 top-0 z-[600] h-0.5" />}
            </div>
        </section>
    )
}

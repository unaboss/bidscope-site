import type { ComponentType, SVGProps } from 'react'
import { CreditCard, MapPinned } from 'lucide-react'
import {
    IconBookmark,
    IconBuilding,
    IconCalendar,
    IconDashboard,
    IconFunnel,
} from '@/components/ui/icons'

export interface NavItem
{
    readonly to: string
    readonly label: string
    readonly icon: ComponentType<SVGProps<SVGSVGElement>>
    /** Plan feature the page needs; the rail marks it when the plan lacks it. */
    readonly feature?: string
}

/** Primary navigation, in the order the workspace flows. */
export const NAV_ITEMS: readonly NavItem[] = [
    { to: '/', label: 'Dashboard', icon: IconDashboard },
    { to: '/discover', label: 'Tenders', icon: IconFunnel },
    { to: '/bookmarks', label: 'Watchlist', icon: IconBookmark, feature: 'bookmarks_calendar' },
    { to: '/calendar', label: 'Calendar', icon: IconCalendar, feature: 'bookmarks_calendar' },
    { to: '/clients', label: 'Clients', icon: MapPinned },
    { to: '/profile', label: 'Company profile', icon: IconBuilding },
    { to: '/billing', label: 'Billing', icon: CreditCard },
]

/** Returns the nav item whose route best matches `pathname`. */
export function findNavItem(pathname: string): NavItem | undefined
{
    return NAV_ITEMS.find((item) =>
        item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
}

import type { ComponentType, SVGProps } from 'react'
import {
    IconBookmark,
    IconBuilding,
    IconCalendar,
    IconDashboard,
    IconFunnel,
    IconQuote,
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
    { to: '/discover', label: 'Discover', icon: IconFunnel },
    { to: '/bookmarks', label: 'Bookmarks', icon: IconBookmark, feature: 'bookmarks_calendar' },
    { to: '/calendar', label: 'Calendar', icon: IconCalendar, feature: 'bookmarks_calendar' },
    { to: '/profile', label: 'Profile', icon: IconBuilding },
    { to: '/bid-profile', label: 'Bid profile', icon: IconQuote },
]

/** Returns the nav item whose route best matches `pathname`. */
export function findNavItem(pathname: string): NavItem | undefined
{
    return NAV_ITEMS.find((item) =>
        item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
}

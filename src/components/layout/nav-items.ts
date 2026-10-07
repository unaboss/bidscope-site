import type { ComponentType, SVGProps } from 'react'
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
}

/** Primary navigation, in the order the workspace flows. */
export const NAV_ITEMS: readonly NavItem[] = [
    { to: '/', label: 'Dashboard', icon: IconDashboard },
    { to: '/discover', label: 'Discover', icon: IconFunnel },
    { to: '/bookmarks', label: 'Bookmarks', icon: IconBookmark },
    { to: '/calendar', label: 'Calendar', icon: IconCalendar },
    { to: '/profile', label: 'Profile', icon: IconBuilding },
]

/** Returns the nav item whose route best matches `pathname`. */
export function findNavItem(pathname: string): NavItem | undefined
{
    return NAV_ITEMS.find((item) =>
        item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
}

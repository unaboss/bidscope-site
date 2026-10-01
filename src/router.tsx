import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { useSession } from '@/lib/session'
import { BillingPage } from '@/pages/billing'
import { BookmarksPage } from '@/pages/bookmarks'
import { CalendarPage } from '@/pages/calendar'
import { DashboardPage } from '@/pages/dashboard'
import { DiscoverPage } from '@/pages/discover'
import { CheckoutPage } from '@/pages/public/checkout'
import { JoinPage } from '@/pages/public/join'
import { LandingPage } from '@/pages/public/landing'
import { TenderDetailPage } from '@/pages/tender-detail'

/** The signed-in application, framed by the navy rail + header. */
function PrivateRoutes()
{
    return (
        <Routes>
            <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="tenders/:id" element={<TenderDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    )
}

/** The public trial funnel: landing, onboarding, payment. */
function PublicRoutes()
{
    return (
        <Routes>
            <Route index element={<LandingPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

/** Brief placeholder while the session probe resolves. */
function Splash()
{
    return (
        <div className="grid min-h-dvh place-items-center bg-cream font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
            Loading…
        </div>
    )
}

/**
 * Chooses the public funnel or the private app from one session probe. The
 * Worker still gates private paths server-side, so a signed-out deep link never
 * reaches this branch.
 */
export function AppRoutes()
{
    const session = useSession()

    if (session === 'loading')
    {
        return <Splash />
    }

    return session === 'authed' ? <PrivateRoutes /> : <PublicRoutes />
}

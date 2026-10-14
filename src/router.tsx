import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { FeatureGate } from '@/components/ui/locked-feature'
import { PlanProvider } from '@/lib/plan'
import { useSession } from '@/lib/session'
import { BillingPage } from '@/pages/billing'
import { BookmarksPage } from '@/pages/bookmarks'
import { CalendarPage } from '@/pages/calendar'
import { DashboardPage } from '@/pages/dashboard'
import { DiscoverPage } from '@/pages/discover'
import { CheckoutPage } from '@/pages/public/checkout'
import { IntroPage } from '@/pages/public/intro'
import { JoinPage } from '@/pages/public/join'
import { LandingPage } from '@/pages/public/landing'
import { SubscribePage } from '@/pages/public/subscribe'
import { ProfilePage } from '@/pages/profile'
import { TenderDetailPage } from '@/pages/tender-detail'

/**
 * The application's pages, framed by the navy rail + header. The signed-in app
 * and the public preview (`/preview`, on sample data) both render these.
 */
export function AppPages()
{
    return (
        <Routes>
            <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route
                    path="bookmarks"
                    element={(
                        <FeatureGate feature="bookmarks_calendar" className="m-4 sm:m-8" title="Save tenders you are chasing" detail="Bookmarks keep your shortlist in one place, with email reminders before briefings and closing dates. They come with Growth and Pro.">
                            <BookmarksPage />
                        </FeatureGate>
                    )}
                />
                <Route
                    path="calendar"
                    element={(
                        <FeatureGate feature="bookmarks_calendar" className="m-4 sm:m-8" title="Every briefing and closing date on one calendar" detail="The calendar plots your saved tenders, flags clashes and syncs to your own calendar. It comes with Growth and Pro.">
                            <CalendarPage />
                        </FeatureGate>
                    )}
                />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<Navigate to="/profile" replace />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="tenders/:id" element={<TenderDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    )
}

/** The signed-in application, on the org's own plan. */
function PrivateRoutes()
{
    return (
        <PlanProvider>
            <AppPages />
        </PlanProvider>
    )
}

/** The public trial funnel: intro, pricing/landing, onboarding, payment. */
function PublicRoutes()
{
    return (
        <Routes>
            <Route index element={<IntroPage />} />
            <Route path="pricing" element={<LandingPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="subscribe" element={<SubscribePage />} />
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

import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/app/layouts/app-shell'
import { FeatureGate } from '@/features/billing/components/locked-feature'
import { PlanProvider } from '@/shared/runtime/plan'
import { useSession } from '@/features/auth/session'
import { BillingPage } from '@/features/billing/pages/index'
import { BookmarksPage } from '@/features/bookmarks/pages'
import { CalendarPage } from '@/features/calendar/pages'
import { DashboardPage } from '@/features/dashboard/pages'
import { DashboardOverview } from '@/features/dashboard/pages/overview'
import { BuyersPage } from '@/features/buyers/pages'
import { DiscoverPage } from '@/features/tenders/pages/discover'
import { CheckoutPage } from '@/features/billing/pages/checkout'
import { IntroPage } from '@/features/marketing/pages/intro'
import { JoinPage } from '@/features/auth/pages/join'
import { PricingPage } from '@/features/marketing/pages/pricing'
import { StartPage } from '@/features/marketing/pages/start'
import { ProductPage } from '@/features/marketing/pages/product'
import { FeaturesPage } from '@/features/marketing/pages/features'
import { AboutPage } from '@/features/marketing/pages/about'
import { ContactPage } from '@/features/marketing/pages/contact'
import { HowItWorksPage } from '@/features/marketing/pages/how-it-works'
import { CoveragePage } from '@/features/marketing/pages/coverage'
import { FaqPage } from '@/features/marketing/pages/faq'
import '@/features/marketing/marketing-pages.css'
import { SubscribePage } from '@/features/billing/pages/subscribe'
import { ProfilePage } from '@/features/profile/pages'
import { TenderDetailPage } from '@/features/tenders/pages/tender-detail'

/**
 * The application's pages, framed by the navy rail + header. The signed-in app
 * and the public preview (`/preview`, on North Tech's account) both render these.
 */
export function AppPages()
{
    return (
        <Routes>
            <Route element={<AppShell />}>
                <Route index element={<DashboardOverview />} />
                <Route path="clients" element={<DashboardPage />} />
                <Route path="buyers" element={<BuyersPage />} />
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
export function AppRoutes()
{
    return (
        <Routes>
            <Route index element={<IntroPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="start" element={<StartPage />} />
            <Route path="product" element={<ProductPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="coverage" element={<CoveragePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="subscribe" element={<SubscribePage />} />
            {['discover', 'bookmarks', 'calendar', 'profile', 'settings', 'billing', 'tenders/:id'].map((path) => (
                <Route key={path} path={path} element={<WorkspaceRedirect />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

/** Preserve old bookmarks and emailed tender links after moving the workspace. */
function WorkspaceRedirect()
{
    const { pathname, search, hash } = useLocation()

    useEffect(() =>
    {
        window.location.replace(`/app${pathname}${search}${hash}`)
    }, [pathname, search, hash])

    return <Splash />
}

/** The login form is served by the Worker, so leave the SPA to open it. */
function SignInRedirect()
{
    const { pathname, search, hash } = useLocation()

    useEffect(() =>
    {
        window.location.replace(`/login?next=${encodeURIComponent('/app' + pathname + search + hash)}`)
    }, [pathname, search, hash])

    return <Splash />
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
 * Only the workspace probes the session; public pages never render the dashboard.
 * The Worker also enforces authentication on workspace pages and private APIs.
 */
export function WorkspaceRoutes()
{
    const session = useSession()

    if (session === 'loading')
    {
        return <Splash />
    }

    return session === 'authed' ? <PrivateRoutes /> : <SignInRedirect />
}

import { useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Brand } from '../components/site-header'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { PlanQuickStart } from '../components/plan-quick-start'
import './start.css'

/** A focused plan decision before the existing three-step registration. */
export function StartPage() {
    const [params] = useSearchParams()
    const value = params.get('tier')
    const tier = value === 'mid' || value === 'all' ? value : 'single'
    return (
        <div className="marketing-page reference-site start-page">
            <a className="market-skip" href="#main-content">Skip to content</a>
            <header className="container start-header">
                <a href="/" aria-label="Bidscope home"><Brand /></a>
                <div>
                    <ThemeToggle />
                    <a href="/"><ArrowLeftIcon size={17} aria-hidden="true" /> Home</a>
                </div>
            </header>
            <main id="main-content">
                <PlanQuickStart entry initialTier={tier} />
            </main>
        </div>
    )
}

import { IconContext } from '@phosphor-icons/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'
import './styles/interactions.css'
import './styles/redesign.css'
import './styles/feature-polish.css'

const root = createRoot(document.getElementById('root') as HTMLElement)

// `/preview` is the app on North Tech's matched tenders, with its own router and a stand-in API,
// loaded only when asked for. Everything else is the real app.
if (/^\/preview(?:\/|$)/.test(window.location.pathname)) {
    void import('./app/preview').then(({ installDemoApi, PreviewApp }) => {
        installDemoApi()
        root.render(
            <StrictMode>
                <IconContext.Provider value={{ weight: 'regular', size: 20, 'aria-hidden': true }}>
                    <PreviewApp />
                </IconContext.Provider>
            </StrictMode>,
        )
    })
} else {
    root.render(
        <StrictMode>
            <IconContext.Provider value={{ weight: 'regular', size: 20, 'aria-hidden': true }}>
                <App />
            </IconContext.Provider>
        </StrictMode>,
    )
}

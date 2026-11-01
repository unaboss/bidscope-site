import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

const root = createRoot(document.getElementById('root') as HTMLElement)

// `/preview` is the app on North Tech's matched tenders, with its own router and a stand-in API,
// loaded only when asked for. Everything else is the real app.
if (/^\/preview(?:\/|$)/.test(window.location.pathname)) {
    void import('./pages/preview').then(({ installDemoApi, PreviewApp }) =>
    {
        installDemoApi()
        root.render(
            <StrictMode>
                <PreviewApp />
            </StrictMode>,
        )
    })
} else {
    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
}

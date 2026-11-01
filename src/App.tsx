import { BrowserRouter } from 'react-router-dom'
import { AppRoutes, WorkspaceRoutes } from '@/router'

export function App()
{
    const workspace = /^\/app(?:\/|$)/.test(window.location.pathname)

    return (
        <BrowserRouter basename={workspace ? '/app' : undefined}>
            {workspace ? <WorkspaceRoutes /> : <AppRoutes />}
        </BrowserRouter>
    )
}

import { useEffect, useState } from 'react'
import { getSession } from '@/api'

export type SessionState = 'loading' | 'authed' | 'anon'

/**
 * Probes the session once at load: `/api/account` answers 200 for a signed-in
 * client and 401 for a visitor. Drives the public/private route split.
 */
export function useSession(): SessionState
{
    const [state, setState] = useState<SessionState>('loading')

    useEffect(() =>
    {
        let active = true

        void getSession().then((ok) =>
        {
            if (active)
            {
                setState(ok ? 'authed' : 'anon')
            }
        })

        return () =>
        {
            active = false
        }
    }, [])

    return state
}

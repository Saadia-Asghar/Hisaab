import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { ensureProfileForUser } from '../lib/ensureProfile'
import { isDemoMode } from '../lib/demoMode'
import { getDemoAuthUser } from '../demo/demoStore'

/** Shape compatible with pages that expect session.user.id (Firebase uid as id). */
function sessionFromFirebaseUser(u) {
  if (!u) return null
  return {
    user: {
      id: u.uid,
      email: u.email ?? undefined,
    },
  }
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      const u = getDemoAuthUser()
      setSession({
        user: u,
      })
      setLoading(false)
      return
    }

    if (!isFirebaseConfigured || !auth) {
      setSession(null)
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) await ensureProfileForUser(u)
      setSession(sessionFromFirebaseUser(u))
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const demo = isDemoMode()
  const appReady = demo || isFirebaseConfigured

  return {
    session,
    user: session?.user ?? null,
    loading,
    isFirebaseConfigured,
    demoMode: demo,
    appReady,
  }
}

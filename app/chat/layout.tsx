"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLock from '../../components/AppLock'
import DebugAuthOverlay from '../../components/DebugAuthOverlay'
import useAuth from '../../hooks/useAuth'

// metadata should not be exported from a client component - keep layout as a client component

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // When leaving the chat layout (client-side navigation away), persist the
  // locked flag so that returning to /chat will show the lock modal if the
  // user has app-lock enabled. We do this in the unmount cleanup of an effect
  // because the layout will unmount during route changes.
  useEffect(() => {
    const LOCK_KEY = 'bb_app_locked'
    return () => {
      try {
        // persist lock flag on leaving chat if pass_blocked is enabled
        if (user?.pass_blocked) sessionStorage.setItem(LOCK_KEY, '1')
      } catch (e) {}
    }
  }, [user])

  useEffect(() => {
    async function ensureAuth() {
      if (loading) return
      if (user) return

      // transient failure protection: re-check /api/auth/me once with credentials
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.user) return // session is valid, bail out
        }
      } catch (e) {
        // ignore and fall through to redirect
      }

      router.push('/login')
    }

    ensureAuth()
  }, [loading, user, router])

  return (
    <AppLock>
      {children}
      <DebugAuthOverlay />
    </AppLock>
  )
}

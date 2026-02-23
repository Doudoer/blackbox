'use client'

import { useEffect, useState, useCallback } from 'react'

export type UserPublic = any

export function useAuth() {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const json = await res.json()
        if (!mounted) return
        setUser(json.user ?? null)
      } catch (err) {
        setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    // listen for profile updates from other components and refresh user
    const handler = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const json = await res.json()
        if (!mounted) return
        setUser(json.user ?? null)
      } catch (err) {
        /* ignore */
      }
    }
    window.addEventListener('profile:updated', handler as EventListener)

    return () => {
      mounted = false
      window.removeEventListener('profile:updated', handler as EventListener)
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Login failed')
  // refresh user
  const me = await fetch('/api/auth/me', { credentials: 'include' })
    const meJson = await me.json()
    setUser(meJson.user ?? null)
    return json
  }, [])

  const signOut = useCallback(async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  return { user, loading, signIn, signOut }
}

export default useAuth

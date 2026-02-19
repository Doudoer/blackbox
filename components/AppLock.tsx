"use client"

import { useEffect, useState, useRef } from 'react'
import useAuth from '../hooks/useAuth'

export default function AppLock({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isLocked, setIsLocked] = useState(false)
  const [unlockKey, setUnlockKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const LOCK_KEY = 'bb_app_locked'

    // initialize locked state from sessionStorage only when user has lock enabled
      try {
      const stored = sessionStorage.getItem(LOCK_KEY)
      // Use pass_blocked as the single source of truth client-side. The server
      // currently uses a global default unlock key, so `has_lock` may be
      // undefined in some cases. Rely on `pass_blocked` to decide whether to
      // require unlocking.
      if (stored === '1' && user?.pass_blocked) {
        setIsLocked(true)
      }
    } catch (e) {
      // ignore storage errors
    }

    const handleBlur = () => {
      if (user?.pass_blocked) {
        // if a file picker or upload is active, ignore this blur (prevents locking when attaching images)
        try {
          const ignore = sessionStorage.getItem('bb_ignore_lock')
          if (ignore === '1') {
            setLastEvent('blur:ignored')
            return
          }
        } catch (e) {}
        try { sessionStorage.setItem(LOCK_KEY, '1') } catch (e) {}
        setIsLocked(true)
        setLastEvent('blur')
      }
    }

    const handleFocus = () => {
      // do not auto-unlock when lock is enabled
      if (user?.pass_blocked) return
      try { sessionStorage.removeItem(LOCK_KEY) } catch (e) {}
      setIsLocked(false)
    }

    const handleVisibility = () => {
      if (document.hidden && user?.pass_blocked) {
        try {
          const ignore = sessionStorage.getItem('bb_ignore_lock')
          if (ignore === '1') {
            setLastEvent('visibility:ignored')
            return
          }
        } catch (e) {}
        try { sessionStorage.setItem(LOCK_KEY, '1') } catch (e) {}
        setIsLocked(true)
        setLastEvent('visibilitychange:hidden')
      }
    }

    const handlePageHide = () => {
      if (user?.pass_blocked) {
        try {
          const ignore = sessionStorage.getItem('bb_ignore_lock')
          if (ignore === '1') {
            setLastEvent('pagehide:ignored')
            return
          }
        } catch (e) {}
        try { sessionStorage.setItem(LOCK_KEY, '1') } catch (e) {}
        setLastEvent('pagehide')
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [user])

  // small debug state to show last event that triggered the lock
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  useEffect(() => {
    if (!lastEvent) return
    const id = setTimeout(() => setLastEvent(null), 2500)
    return () => clearTimeout(id)
  }, [lastEvent])

  const verifyUnlock = async () => {
    setVerifying(true)
    setError(null)
    try {
  const res = await fetch('/api/profile/verify-lock', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lock_key: unlockKey }) })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || 'Clave incorrecta')
        return
      }
      // clear persisted lock and local locked state
      try { sessionStorage.removeItem('bb_app_locked') } catch (e) {}
      setIsLocked(false)
      setUnlockKey('')
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setVerifying(false)
    }
  }

  // autofocus the input when lock becomes active
  useEffect(() => {
    if (isLocked && inputRef.current) {
      try { inputRef.current.focus() } catch (e) {}
    }
  }, [isLocked])

  useEffect(() => {
    // prevent background scrolling while locked
    const prev = document.body.style.overflow
    if (isLocked) {
      try { document.body.style.overflow = 'hidden' } catch (e) {}
    } else {
      try { document.body.style.overflow = prev } catch (e) {}
    }
    return () => {
      try { document.body.style.overflow = prev } catch (e) {}
    }
  }, [isLocked])

  return (
    <div className="relative">
      {/* visually obscure and disable interaction with the children when locked */}
      <div aria-hidden={isLocked} style={isLocked ? { filter: 'blur(3px) brightness(.6)', pointerEvents: 'none' } : undefined}>
        {children}
      </div>

      {isLocked && (
        // Visual debug override: force a very visible full-screen white modal
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(96vw, 720px)', padding: 24, borderRadius: 10, background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>APP BLOQUEADA</h1>
            <p style={{ margin: 0, marginBottom: 18, color: '#444' }}>La aplicación está bloqueada. Introduce la clave para desbloquear.</p>
            <input ref={inputRef} autoFocus type="password" value={unlockKey} onChange={(e) => setUnlockKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') verifyUnlock() }} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, fontSize: 16, boxSizing: 'border-box' }} />
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={verifyUnlock} disabled={verifying} className="btn" style={{ padding: '10px 16px' }}>Desbloquear</button>
            </div>
          </div>
        </div>
      )}

      {/* small visible debug toast so you can see which event fired last */}
      {lastEvent && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 20, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '6px 12px', borderRadius: 8, zIndex: 10000 }}>
          Evento: {lastEvent}
        </div>
      )}
    </div>
  )
}

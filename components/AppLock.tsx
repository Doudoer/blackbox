"use client"

import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'

export default function AppLock({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isBlurred, setIsBlurred] = useState(false)
  const [unlockKey, setUnlockKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const handleBlur = () => setIsBlurred(true)
    const handleFocus = () => {
      // keep blurred until user explicitly unlocks when app-lock is enabled
      if (user?.pass_blocked && user?.has_lock) {
        // don't auto-unblur on focus
        return
      }
      setIsBlurred(false)
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

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
      setIsBlurred(false)
      setUnlockKey('')
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="relative">
      {children}
      {isBlurred && (
        <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-md flex items-center justify-center z-50">
          {user?.pass_blocked && user?.has_lock ? (
            <div style={{ width: 360, padding: 16, borderRadius: 12, background: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
              <div style={{ marginBottom: 8, fontWeight: 700 }}>App bloqueada</div>
              <div style={{ marginBottom: 8, color: 'var(--muted)' }}>Introduce tu clave de bloqueo para desbloquear.</div>
              <input type="password" value={unlockKey} onChange={(e) => setUnlockKey(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
              {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setIsBlurred(false); setUnlockKey(''); setError(null) }} className="btn">Cancelar</button>
                <button onClick={verifyUnlock} disabled={verifying} className="btn">Desbloquear</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">App bloqueada por privacidad</p>
          )}
        </div>
      )}
    </div>
  )
}

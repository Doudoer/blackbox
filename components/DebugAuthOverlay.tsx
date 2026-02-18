"use client"

import { useEffect, useState } from 'react'

// Silent debug overlay: render only when NEXT_PUBLIC_SHOW_DEBUG_AUTH is 'true'
// This keeps the component available for local debugging but hides it by default.
export default function DebugAuthOverlay() {
  if (typeof process === 'undefined') return null
  const enabled = process?.env?.NEXT_PUBLIC_SHOW_DEBUG_AUTH === 'true'
  if (!enabled) return null

  const [last, setLast] = useState<{ ts: string; ok: boolean; status: number; body: any } | null>(null)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    let mounted = true
    let timer: number | undefined

    async function poll() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const json = await res.json().catch(() => null)
        if (!mounted) return
        setLast({ ts: new Date().toLocaleTimeString(), ok: res.ok, status: res.status, body: json })
      } catch (err) {
        if (!mounted) return
        setLast({ ts: new Date().toLocaleTimeString(), ok: false, status: 0, body: String(err) })
      } finally {
        if (!mounted) return
        timer = window.setTimeout(() => poll(), 2000)
      }
    }

    if (running) poll()

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
  }, [running])

  if (!last) return null

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, width: 360, maxWidth: 'calc(100% - 24px)' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: 10, borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <strong style={{ fontSize: 12 }}>Debug Auth</strong>
          <div>
            <button onClick={() => setRunning(r => !r)} style={{ marginRight: 8 }}>{running ? 'Pause' : 'Resume'}</button>
            <button onClick={() => setLast(null)}>Clear</button>
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <div><strong>Última comprobación:</strong> {last.ts}</div>
          <div><strong>HTTP:</strong> {last.status} {last.ok ? 'OK' : 'FAIL'}</div>
        </div>

        <div style={{ maxHeight: 220, overflow: 'auto', background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4 }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(last.body, null, 2)}</pre>
        </div>

        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
          Nota: la cookie HttpOnly no es accesible desde JavaScript. Este overlay muestra lo que devuelve el endpoint `/api/auth/me` cuando se llama con credenciales.
        </div>
      </div>
    </div>
  )
}

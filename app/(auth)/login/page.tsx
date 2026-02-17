 'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../../hooks/useAuth'
export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Redirect after render to avoid setting state during render
  useEffect(() => {
    if (!loading && user) {
      router.push('/chat')
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signIn(username, password)
      router.push('/chat')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="login-hero">
      <div className="card login-card-large" style={{ width: 760, display: 'flex', gap: 0, alignItems: 'stretch' }}>
        <div style={{ width: 320, padding: 26, borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="brand">
            <div className="logo">R</div>
            <div>
              <div className="h-title">Rodriguez Salvage Yard</div>
              <div className="h-sub">Panel de demo</div>
            </div>
          </div>
          <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>Accede a la Intranet</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--muted)' }} className="small">Usuarios de prueba: alice / Test1234!</div>
        </div>

        <div style={{ padding: 36, flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'white' }}>Accede a la Intranet</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Ingresa tus credenciales para acceder al panel privado</p>
          {error && <div style={{ color: '#fca5a5', marginBottom: 8 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 999, padding: '10px 12px' }}>
                <span style={{ color: 'var(--muted)' }}>👤</span>
                <input className="input" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} style={{ border: 0, padding: 0 }} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 999, padding: '10px 12px' }}>
                <span style={{ color: 'var(--muted)' }}>🔒</span>
                <input className="input" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ border: 0, padding: 0 }} />
              </div>
            </div>

            <button className="btn" disabled={loading} type="submit" style={{ width: '100%', display: 'block', marginTop: 6 }}>ENTRAR</button>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../../hooks/useAuth'
import { User, Lock, Shield, Eye, EyeOff, Loader, AlertCircle } from 'react-feather'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat')
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn(username, password)
      router.push('/chat')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#39FF14]/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#39FF14]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#39FF14_1px,transparent_1px)] [background-size:32px_32px]"></div>

      <div className="glass-panel w-full max-w-4xl flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in">

        {/* Left Side - Branding/Info */}
        <div className="md:w-[40%] p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02] flex flex-col justify-between relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#39FF14]/30 to-transparent flex items-center justify-center font-bold text-[#39FF14] text-2xl border border-[#39FF14]/40 shadow-[0_0_25px_rgba(57,255,20,0.2)]">
                B
              </div>
              <div>
                <h1 className="font-heading text-white text-3xl font-bold tracking-tight leading-none">Blackbox</h1>
                <p className="text-[#94a3b8] text-xs uppercase tracking-[0.4em] mt-2 opacity-60">Protocols Active</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-white font-heading text-xl font-bold leading-tight">Acceso Restringido</h2>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                Bienvenido al núcleo de comunicaciones cifradas. Inicie sesión para acceder a sus canales seguros.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="p-4 rounded-2xl bg-[#39FF14]/5 border border-[#39FF14]/20">
              <div className="flex items-center gap-3 mb-2 text-[#39FF14]">
                <Shield size={16} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Modo Demo Activo</span>
              </div>
              <p className="text-[#94a3b8] text-[10px] leading-relaxed opacity-70">
                Utilice las credenciales de prueba:<br />
                <span className="text-white/80 font-mono">alice / Test1234!</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-white text-2xl font-bold tracking-tight font-heading">Identificación</h3>
            <p className="text-[#94a3b8] text-sm mt-2">Ingrese sus credenciales operativas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[#94a3b8] text-[10px] uppercase tracking-[0.2em] font-bold ml-1">ID Operador</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#39FF14] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Usuario o Alias"
                  className="w-full cyber-input pl-12 h-14 text-base"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[#94a3b8] text-[10px] uppercase tracking-[0.2em] font-bold ml-1">Clave de Acceso</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#39FF14] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full cyber-input pl-12 pr-12 h-14 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FF3131]/10 border border-[#FF3131]/20 text-[#FF3131] animate-shake">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
              </div>
            )}

            <button
              className="w-full btn-neon py-5 text-sm uppercase tracking-[0.3em] font-bold relative group overflow-hidden disabled:opacity-50"
              disabled={loading || isSubmitting}
              type="submit"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isSubmitting ? <Loader className="animate-spin" size={20} /> : "Iniciar Secuencia"}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>

          <div className="mt-12 text-center border-t border-white/5 pt-8">
            <p className="text-[#94a3b8] text-[9px] uppercase tracking-[0.3em] font-mono opacity-30">
              Terminal v2.4.0 <br className="md:hidden" /> // Security System Integrity: Verified
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

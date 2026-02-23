"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Camera, Loader, Check, AlertCircle } from 'react-feather'
import useAuth from '../hooks/useAuth'

export default function ProfileSettings({ onClose }: { onClose: () => void }) {
    const { user } = useAuth()
    const [username, setUsername] = useState(user?.username || '')
    const [nombreMostrar, setNombreMostrar] = useState(user?.nombre_mostrar || '')
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
    const [appLockPin, setAppLockPin] = useState('')
    const [isAppLockLoading, setIsAppLockLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (user) {
            setUsername(user.username || '')
            setNombreMostrar(user.nombre_mostrar || '')
            setAvatarUrl(user.avatar_url || '')
        }
    }, [user])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setMessage(null)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al subir imagen')

            setAvatarUrl(data.publicURL)
            setMessage({ type: 'success', text: 'Imagen subida correctamente' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsUploading(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, avatar_url: avatarUrl, nombre_mostrar: nombreMostrar }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil')

            setMessage({ type: 'success', text: 'Perfil actualizado con éxito' })

            // Dispatch event to refresh useAuth state
            window.dispatchEvent(new CustomEvent('profile:updated'))
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsSaving(false)
        }
    }

    const hashPin = async (pin: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(pin)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const handleToggleAppLock = async (enable: boolean) => {
        if (enable && appLockPin.length < 4) {
            setMessage({ type: 'error', text: 'El PIN de bloqueo debe tener al menos 4 caracteres' })
            return
        }

        setIsAppLockLoading(true)
        setMessage(null)

        try {
            const hashedPin = enable ? await hashPin(appLockPin) : null
            const res = await fetch('/api/profile/app-lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lock_key_hash: hashedPin })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al actualizar bloqueo de app')

            setMessage({ type: 'success', text: enable ? 'Bloqueo activado exitosamente' : 'Bloqueo desactivado' })
            if (!enable) setAppLockPin('')
            window.dispatchEvent(new CustomEvent('profile:updated'))
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsAppLockLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
            return
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' })
            return
        }

        setIsSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña')

            setMessage({ type: 'success', text: 'Contraseña actualizada con éxito' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-scale-in">
            <div className="glass-panel w-full max-w-md overflow-hidden relative border-[#39FF14]/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14]/40 to-transparent"></div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
                >
                    <X size={18} />
                </button>

                <div className="p-8">
                    <div className="mb-6">
                        <h2 className="text-white font-heading text-2xl font-bold tracking-tight">Ajustes</h2>
                        <div className="flex gap-4 mt-4 border-b border-white/5">
                            <button
                                onClick={() => { setActiveTab('profile'); setMessage(null); }}
                                className={`pb-2 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'profile' ? 'text-[#39FF14] border-b-2 border-[#39FF14]' : 'text-[#94a3b8] opacity-60 hover:opacity-100'}`}
                            >
                                Perfil
                            </button>
                            <button
                                onClick={() => { setActiveTab('security'); setMessage(null); }}
                                className={`pb-2 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'security' ? 'text-[#39FF14] border-b-2 border-[#39FF14]' : 'text-[#94a3b8] opacity-60 hover:opacity-100'}`}
                            >
                                Seguridad
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'profile' ? (
                            <>
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center">
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#39FF14] to-transparent shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                                            <div className="w-full h-full rounded-full bg-[#0d111c] overflow-hidden border border-white/10">
                                                {isUploading ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                                                        <Loader className="text-[#39FF14] animate-spin" size={24} />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={avatarUrl || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' fill='%23131a27'/><text x='50%' y='60%' font-size='50' text-anchor='middle' fill='%2339FF14' font-family='Outfit, sans-serif' font-weight='bold' style='opacity: 0.8'>${encodeURIComponent((username || '?').charAt(0).toUpperCase())}</text></svg>`}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="text-white" size={20} />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    <span className="text-[#94a3b8] text-[9px] uppercase tracking-widest mt-2 opacity-40">Cambiar Foto</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">Nombre a Mostrar</label>
                                        <input
                                            type="text"
                                            value={nombreMostrar}
                                            onChange={(e) => setNombreMostrar(e.target.value)}
                                            placeholder="Tu nombre público..."
                                            className="w-full cyber-input text-sm h-11"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">ID Usuario (@)</label>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full cyber-input text-sm h-11 opacity-70 bg-white/5"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1 text-[#39FF14]">Tu PIN Único</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={user?.pin || '------'}
                                                    readOnly
                                                    className="w-full cyber-input text-sm h-11 opacity-90 bg-[#39FF14]/5 text-[#39FF14] font-mono font-bold tracking-widest text-center cursor-default select-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving || isUploading}
                                        className="w-full btn-neon py-3 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader className="animate-spin text-black" size={18} /> : "Guardar Perfil"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="space-y-1.5">
                                    <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">Contraseña Actual</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full cyber-input text-sm h-11"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full cyber-input text-sm h-11"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full cyber-input text-sm h-11"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={isSaving}
                                    className="w-full btn-neon py-3 disabled:opacity-50 mt-2"
                                >
                                    {isSaving ? <Loader className="animate-spin text-black" size={18} /> : "Actualizar Contraseña"}
                                </button>

                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-white font-bold text-sm">Bloqueo de Aplicación</h4>
                                            <p className="text-[#94a3b8] text-[9px] mt-1 pr-4">Si está activado, la app pedirá esta clave al minimizar o cambiar de ventana.</p>
                                        </div>
                                        <div className={`px-3 py-1 text-[10px] font-bold rounded-full border ${user?.lock_key_hash ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                            {user?.lock_key_hash ? 'ACTIVO' : 'INACTIVO'}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">PIN de Bloqueo (al menos 4 caracteres)</label>
                                            <input
                                                type="password"
                                                value={appLockPin}
                                                onChange={(e) => setAppLockPin(e.target.value)}
                                                className="w-full cyber-input text-sm h-11 text-center tracking-widest"
                                                placeholder={user?.lock_key_hash ? "••••••••" : "Introduce un PIN"}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleToggleAppLock(true)}
                                                disabled={isAppLockLoading || (!user?.lock_key_hash && appLockPin.length < 4)}
                                                className="w-full py-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                                            >
                                                {isAppLockLoading ? <Loader className="animate-spin mx-auto" size={14} /> : (user?.lock_key_hash ? "Cambiar PIN" : "Activar Bloqueo")}
                                            </button>
                                            {user?.lock_key_hash && (
                                                <button
                                                    onClick={() => handleToggleAppLock(false)}
                                                    disabled={isAppLockLoading}
                                                    className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50"
                                                >
                                                    {isAppLockLoading ? <Loader className="animate-spin mx-auto" size={14} /> : "Desactivar"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className={`p-3 rounded-xl flex items-center gap-3 animate-fade-in-up ${message.type === 'success'
                                ? 'bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14]'
                                : 'bg-[#FF3131]/10 border border-[#FF3131]/20 text-[#FF3131]'
                                }`}>
                                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span className="text-xs font-semibold">{message.text}</span>
                            </div>
                        )}

                        <div className="text-center">
                            <button
                                onClick={onClose}
                                className="text-[#94a3b8] hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                            >
                                Volver al Chat
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Decoration */}
                <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[#94a3b8] text-[8px] uppercase tracking-[0.3em] font-mono opacity-20">Blackbox Protocols Active</p>
                </div>
            </div>
        </div >
    )
}

"use client"

import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock, AlertCircle } from 'react-feather'

interface AppLockScreenProps {
    lockKeyHash: string
    onUnlock: () => void
}

export default function AppLockScreen({ lockKeyHash, onUnlock }: AppLockScreenProps) {
    const [pin, setPin] = useState('')
    const [errorCode, setErrorCode] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const [failedAttempts, setFailedAttempts] = useState(0)
    const [isNuked, setIsNuked] = useState(false)
    const [isNuking, setIsNuking] = useState(false)

    useEffect(() => {
        // Force focus heavily to prevent bypassing
        if (isNuked) return
        const interval = setInterval(() => {
            if (inputRef.current) inputRef.current.focus()
        }, 500)
        return () => clearInterval(interval)
    }, [isNuked])

    const hashPin = async (raw: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(raw)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const handleNuke = async () => {
        setIsNuking(true)
        try {
            await fetch('/api/profile/nuke', { method: 'POST', credentials: 'include' })
            setIsNuked(true)
        } catch (err) {
            console.error('[AppLock] Error nuking:', err)
        } finally {
            setIsNuking(false)
        }
    }

    const handleVerify = async () => {
        if (pin.length < 4 || isNuked || isNuking) return
        const hashed = await hashPin(pin)
        if (hashed === lockKeyHash) {
            setErrorCode(false)
            setFailedAttempts(0)
            onUnlock()
        } else {
            const newAttempts = failedAttempts + 1
            setFailedAttempts(newAttempts)
            setErrorCode(true)
            setPin('')

            if (newAttempts >= 5) {
                handleNuke()
            } else {
                setTimeout(() => setErrorCode(false), 2000)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070b14]/95 backdrop-blur-[30px] animate-fade-in">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#39FF14_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10 p-8 glass-card border border-[#39FF14]/20 rounded-[2.5rem] shadow-[0_0_80px_rgba(57,255,20,0.15)] flex flex-col items-center justify-center max-w-sm w-[90%] mx-auto animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 shadow-[0_0_30px_rgba(57,255,20,0.2)] flex items-center justify-center mb-6">
                    {isNuked ? (
                        <AlertCircle size={32} className="text-[#FF3131] animate-pulse" />
                    ) : errorCode ? (
                        <Lock size={32} className="text-[#FF3131] animate-shake" />
                    ) : (
                        <Lock size={32} className="text-[#39FF14] animate-pulse" />
                    )}
                </div>

                <h2 className={`text-2xl font-bold font-heading mb-2 ${isNuked ? 'text-[#FF3131]' : 'text-white'}`}>
                    {isNuked ? 'SISTEMA BLOQUEADO' : 'Terminal Bloqueada'}
                </h2>
                <p className="text-[#94a3b8] text-sm text-center mb-8">
                    {isNuked
                        ? 'Se ha detectado un acceso no autorizado. Los datos han sido eliminados por seguridad.'
                        : 'Ingresa tu clave de acceso de 4+ dígitos para reanudar la sesión.'}
                </p>

                {isNuked ? (
                    <div className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                        <p className="text-[#FF3131] text-xs font-bold uppercase tracking-widest">
                            CONTACTE AL ADMINISTRADOR PARA EL DESBLOQUEO
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-full relative">
                            <input
                                ref={inputRef}
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleVerify()
                                }}
                                disabled={isNuking}
                                placeholder="••••••••"
                                className={`w-full h-14 bg-black/40 border ${errorCode ? 'border-[#FF3131] shadow-[0_0_15px_rgba(255,49,49,0.2)]' : 'border-white/10 focus:border-[#39FF14] focus:shadow-[0_0_15px_rgba(57,255,20,0.2)]'} text-white text-center text-xl tracking-[0.5em] rounded-2xl outline-none transition-all placeholder:text-white/20`}
                                autoFocus
                            />
                            {errorCode && (
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-center text-[#FF3131] text-xs font-bold animate-fade-in-up">
                                    <AlertCircle size={14} className="mr-1" />
                                    {failedAttempts >= 5 ? 'AUTODESTRUCCIÓN ACTIVA' : 'Acceso Denegado'}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={isNuking}
                            className={`w-full h-12 mt-8 rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center ${isNuking ? 'bg-white/10 text-white/40' : 'bg-[#39FF14] text-black hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                                }`}
                        >
                            {isNuking ? 'Eliminando Datos...' : 'Desbloquear'}
                        </button>

                        {failedAttempts > 0 && (
                            <p className="mt-4 text-[10px] uppercase font-bold tracking-widest text-red-500/60">
                                Intento {failedAttempts} de 5
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Decorative Branding */}
            <div className="absolute bottom-8 text-center opacity-40">
                <p className="text-[#39FF14] font-bold text-[10px] tracking-[0.3em] uppercase mb-1">Blackbox Core Security</p>
                <p className="text-white/60 text-xs font-mono">Restricted Access Module</p>
            </div>
        </div>
    )
}

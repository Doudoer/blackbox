"use client"

import { useState, useEffect } from 'react'

export default function AppLock({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        const handleBlur = () => setIsLocked(true)
        const handleFocus = () => setIsLocked(false)

        window.addEventListener('blur', handleBlur)
        window.addEventListener('focus', handleFocus)

        return () => {
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    return (
        <div className={`relative w-full h-full transition-all duration-300 ${isLocked ? 'blur-xl' : ''}`}>
            {children}
            {isLocked && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white font-bold shadow-2xl">
                        SISTEMA BLOQUEADO - REGRESE AL FOCO
                    </div>
                </div>
            )}
        </div>
    )
}

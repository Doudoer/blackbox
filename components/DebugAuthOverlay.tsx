"use client"

import useAuth from '../hooks/useAuth'

export default function DebugAuthOverlay() {
    const { user, loading } = useAuth()

    if (process.env.NODE_ENV !== 'development') return null

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-[10px] text-white p-2 rounded-md border border-white/10 font-mono pointer-events-none">
            <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                    <span className="opacity-50">STATUS:</span>
                    <span className={loading ? "text-yellow-400" : "text-green-400"}>{loading ? 'LOADING' : 'READY'}</span>
                </div>
                <div className="flex gap-2">
                    <span className="opacity-50">USER:</span>
                    <span>{user ? user.username : 'ANONYMOUS'}</span>
                </div>
                {user && (
                    <div className="text-[8px] opacity-40">{user.id}</div>
                )}
            </div>
        </div>
    )
}

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../hooks/useAuth'
import {
    Users,
    Settings,
    Shield,
    Search,
    Lock,
    Unlock,
    Trash2,
    Plus,
    Key,
    RefreshCw,
    MoreVertical,
    LogOut,
    Layout,
    HardDrive,
    MessageSquare,
    AlertCircle,
    Menu,
    X
} from 'react-feather'

type AdminTab = 'dashboard' | 'users' | 'messages' | 'system'

export default function AdminDashboard() {
    const router = useRouter()
    const { user, loading, signOut } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        if (!loading && (!user || !user.is_admin)) {
            router.push('/login')
        }
    }, [loading, user, router])

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/admin/users', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleAction = async (userId: string, action: string, value: any = null) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, value }),
                credentials: 'include'
            })
            if (res.ok) {
                fetchUsers()
            } else {
                const err = await res.json()
                alert(`Error: ${err.error}`)
            }
        } catch (err) {
            console.error('Error performing action:', err)
        }
    }

    const handleDeleteUser = async (userId: string, username: string) => {
        const confirmStr = `DELETE ${username}`
        const input = prompt(`ESTÁS SEGURO DE ELIMINAR PERMANENTEMENTE AL OPERADOR @${username}?\nEsta acción es irreversible.\nPara confirmar, escribe exactamente: ${confirmStr}`)

        if (input !== confirmStr) {
            if (input !== null) alert('Confirmación incorrecta. Acción cancelada.')
            return
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (res.ok) {
                alert(`Usuario ${username} eliminado correctamente.`)
                fetchUsers()
            } else {
                const err = await res.json()
                alert(`Error al eliminar: ${err.error}`)
            }
        } catch (err) {
            console.error('Error deleting user:', err)
        }
    }

    const handleSystemAction = async (action: string) => {
        const messages: Record<string, string> = {
            clear_messages: '¿Estás seguro de borrar TODOS los mensajes de la plataforma?',
            clear_storage: '¿Estás seguro de purgar todos los archivos del Storage?'
        }
        if (!confirm(messages[action] || '¿Confirmar acción?')) return

        try {
            const res = await fetch('/api/admin/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
                credentials: 'include'
            })
            if (res.ok) {
                const data = await res.json()
                alert(data.message)
                fetchUsers()
            } else {
                const err = await res.json()
                alert(`Error: ${err.error}`)
            }
        } catch (err) {
            console.error('Error performing system action:', err)
        }
    }

    const onCreateUser = async () => {
        const username = prompt('Ingrese el nombre de usuario:')
        if (!username) return
        const password = prompt('Ingrese la contraseña inicial:')
        if (!password) return

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            })
            if (res.ok) {
                fetchUsers()
            } else {
                const err = await res.json()
                alert(`Error: ${err.error}`)
            }
        } catch (err) {
            console.error('Error creating user:', err)
        }
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    if (loading || !user) return <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-[#39FF14] font-mono animate-pulse">LOADING_ADMIN_PROTOCOLS...</div>

    const NavItems = () => (
        <>
            <button
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'dashboard' ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'text-[#94a3b8] border-transparent hover:bg-white/5 hover:text-white'}`}
            >
                <Layout size={18} />
                Dashboard
            </button>
            <button
                onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'users' ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'text-[#94a3b8] border-transparent hover:bg-white/5 hover:text-white'}`}
            >
                <Users size={18} />
                Usuarios
            </button>
            <button
                onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'messages' ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'text-[#94a3b8] border-transparent hover:bg-white/5 hover:text-white'}`}
            >
                <MessageSquare size={18} />
                Mensajes
            </button>
            <button
                onClick={() => { setActiveTab('system'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'system' ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'text-[#94a3b8] border-transparent hover:bg-white/5 hover:text-white'}`}
            >
                <HardDrive size={18} />
                Sistema
            </button>
        </>
    )

    return (
        <div className="h-screen bg-[#070b14] text-white flex font-sans selection:bg-[#39FF14]/30 selection:text-[#39FF14] overflow-hidden">

            {/* Sidebar Desktop */}
            <aside className="w-64 border-r border-white/5 bg-white/[0.02] flex flex-col p-6 hidden md:flex shrink-0">
                <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => router.push('/chat')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39FF14]/30 to-transparent flex items-center justify-center font-bold text-[#39FF14] border border-[#39FF14]/40 shadow-[0_0_15px_rgba(57,255,20,0.1)] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all">
                        B
                    </div>
                    <span className="font-heading font-bold text-xl tracking-tight">Blackbox <span className="text-[#39FF14] text-xs">CRM</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItems />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 font-medium text-sm transition-all"
                    >
                        <LogOut size={18} />
                        Desconectar
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-[#070b14] flex flex-col p-6 md:hidden animate-fade-in">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#39FF14]/20 flex items-center justify-center font-bold text-[#39FF14] border border-[#39FF14]/40">B</div>
                            <span className="font-heading font-bold text-xl">Blackbox CRM</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#39FF14]">
                            <X size={24} />
                        </button>
                    </div>
                    <nav className="space-y-4">
                        <NavItems />
                    </nav>
                    <div className="mt-auto pt-6 border-t border-white/5">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-bold">
                            <LogOut size={18} /> Desconectar
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#39FF14]">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-[#39FF14]">ADMIN_PORTAL</span>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-thin scrollbar-thumb-white/10">

                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                        <div className="animate-fade-in">
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h1 className="text-3xl font-bold font-heading mb-2">Protocolos Centrales</h1>
                                    <p className="text-[#94a3b8] text-sm italic opacity-70">Resumen operativo del nodo principal. Sesión: @{user.username}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => fetchUsers()} className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#94a3b8] hover:text-[#39FF14] transition-all">
                                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                {[
                                    { label: 'Carga de Datos', value: users.length, icon: <Users />, color: 'text-blue-500', sub: 'Perfiles activos' },
                                    { label: 'Protocolos Block', value: users.filter(u => u.pass_blocked).length, icon: <Shield />, color: 'text-red-500', sub: 'Accesos denegados' },
                                    { label: 'Sincronización', value: '100%', icon: <RefreshCw />, color: 'text-[#39FF14]', sub: 'Estado de red' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                        <div>
                                            <p className="text-[#94a3b8] text-[10px] uppercase tracking-[0.2em] font-bold mb-1 opacity-60">{stat.label}</p>
                                            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                            <p className="text-[10px] text-[#39FF14]/50 font-mono">{stat.sub}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#39FF14]/5 to-transparent border border-[#39FF14]/10">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle className="text-[#39FF14]" size={20} />
                                    Bienvenido al Centro de Mando
                                </h3>
                                <p className="text-[#94a3b8] leading-relaxed max-w-2xl">
                                    Utiliza las pestañas laterales para navegar entre las diferentes herramientas de administración. Desde aquí puedes supervisar la actividad de los operadores y mantener la integridad del sistema Blackbox.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Users View */}
                    {activeTab === 'users' && (
                        <div className="animate-fade-in">
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h1 className="text-3xl font-bold font-heading mb-2">Gestión de Operadores</h1>
                                    <p className="text-[#94a3b8] text-sm italic opacity-70">Administración de credenciales y permisos.</p>
                                </div>
                                <button onClick={onCreateUser} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#39FF14] text-black font-bold text-sm hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all">
                                    <Plus size={18} /> Crear Operador
                                </button>
                            </header>

                            <div className="glass-panel overflow-hidden border border-white/5 rounded-[2.5rem]">
                                <div className="p-6 border-b border-white/5">
                                    <div className="relative max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Filtrar por ID o Nombre..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-[#39FF14] outline-none transition-all"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                                <th className="px-8 py-5 text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">Identidad</th>
                                                <th className="px-6 py-5 text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">Estado</th>
                                                <th className="px-6 py-5 text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">Jerarquía</th>
                                                <th className="px-8 py-5 text-right text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.filter(u =>
                                                u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                u.nombre_mostrar?.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).map((usr) => (
                                                <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl bg-white/5 border ${usr.is_admin ? 'border-[#39FF14]/30' : 'border-white/10'} flex items-center justify-center`}>
                                                                <Users size={16} className={usr.is_admin ? 'text-[#39FF14]' : 'text-[#94a3b8]'} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm">{usr.nombre_mostrar || usr.username}</p>
                                                                <p className="text-[#94a3b8] text-[10px] font-mono opacity-50">@{usr.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${usr.pass_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#39FF14]/5 text-[#39FF14] border-[#39FF14]/20'}`}>
                                                            {usr.pass_blocked ? 'Bloqueado' : 'Activo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 font-bold text-[10px] tracking-widest opacity-60">
                                                        {usr.is_admin ? 'SUPERVISOR' : 'OPERADOR'}
                                                    </td>
                                                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { const pass = prompt(`Nueva contraseña para ${usr.username}:`); if (pass) handleAction(usr.id, 'reset_password', pass) }}
                                                            className="p-2 rounded-lg bg-white/5 text-[#94a3b8] hover:text-[#39FF14] border border-white/5 transition-all"
                                                            title="Cambiar Contraseña"
                                                        >
                                                            <Key size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { const pin = prompt(`Nuevo PIN/Lock para ${usr.username}:`); if (pin) handleAction(usr.id, 'reset_pin', pin) }}
                                                            className="p-2 rounded-lg bg-white/5 text-[#94a3b8] hover:text-[#39FF14] border border-white/5 transition-all"
                                                            title="Modificar PIN / Lock Key"
                                                        >
                                                            <Shield size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm(`¿Deseas ${usr.is_admin ? 'quitar' : 'conceder'} privilegios de SUPERVISOR a @${usr.username}?`)) handleAction(usr.id, 'toggle_admin', !usr.is_admin) }}
                                                            className={`p-2 rounded-lg border transition-all ${usr.is_admin ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'bg-white/5 text-[#94a3b8] border-white/5'}`}
                                                            title={usr.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                                                        >
                                                            <Settings size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(usr.id, 'toggle_lock', !usr.pass_blocked)}
                                                            className={`p-2 rounded-lg border transition-all ${usr.pass_blocked ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}
                                                            title={usr.pass_blocked ? 'Desbloquear Cuenta' : 'Bloquear Cuenta'}
                                                        >
                                                            {usr.pass_blocked ? <Unlock size={14} /> : <Lock size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(usr.id, usr.username)}
                                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Eliminar Cuenta"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages View Placeholder */}
                    {activeTab === 'messages' && (
                        <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#94a3b8] mb-6">
                                <MessageSquare size={40} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Protocolos de Mensajería</h2>
                            <p className="text-[#94a3b8] max-w-sm mb-8">El monitoreo de logs de mensajes está encriptado por seguridad. Utiliza la sección de Sistema para purgas de base de datos.</p>
                            <button
                                onClick={() => handleSystemAction('clear_messages')}
                                className="px-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
                            >
                                Limpiar Historial Global
                            </button>
                        </div>
                    )}

                    {/* System View */}
                    {activeTab === 'system' && (
                        <div className="animate-fade-in">
                            <header className="mb-10">
                                <h1 className="text-3xl font-bold font-heading mb-2">Mantenimiento de Núcleo</h1>
                                <p className="text-[#94a3b8] text-sm italic opacity-70">Operaciones críticas e irreversibles del ecosistema.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                                    <Trash2 className="text-orange-500 mb-4" size={32} />
                                    <h4 className="text-white font-bold text-lg mb-2">Base de Registros</h4>
                                    <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed">Elimina todas las entradas de la tabla 'messages'. Esta acción es permanente y no puede ser deshecha.</p>
                                    <button onClick={() => handleSystemAction('clear_messages')} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-orange-500/20 hover:text-orange-500 hover:border-orange-500/30 transition-all">EJECUTAR_BORRADO</button>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                                    <HardDrive className="text-blue-500 mb-4" size={32} />
                                    <h4 className="text-white font-bold text-lg mb-2">Supabase Storage</h4>
                                    <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed">Purga todos los archivos (imágenes, audios) del bucket configurado. Libera espacio inmediatamente.</p>
                                    <button onClick={() => handleSystemAction('clear_storage')} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/30 transition-all">EJECUTAR_PURGA</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    )
}

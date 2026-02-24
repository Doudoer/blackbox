'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import createClient from '../../lib/supabase'
import useRealtimeMessages from '../../hooks/useRealtimeMessages'
import ChatMessage from '../../components/ChatMessage'
import ChatInput from '../../components/ChatInput'
import useAuth from '../../hooks/useAuth'
import { Smile, Paperclip, LogOut, Settings, Trash2, Menu, X, Search, UserPlus, Check, AlertCircle, Loader, Bell } from 'react-feather'
import { useRouter } from 'next/navigation'
import ProfileSettings from '../../components/ProfileSettings'
import AppLockScreen from '../../components/AppLockScreen'

/* ─── Add Contact Modal ───────────────────────────────────────────────────── */
function AddContactModal({ onClose, onAdded }: { onClose: () => void; onAdded: (contact: any) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts?q=${encodeURIComponent(q)}`, {
        method: 'PATCH',
        credentials: 'include',
      })
      const j = await res.json()
      setResults(j.ok ? j.users : [])
    } catch { setResults([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Only search automatically if exactly 6 characters
    if (query.length === 6) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => search(query), 300)
    } else {
      setResults([]) // Clear results if not 6 chars
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Removed the 'load all on mount' generic search
  // useEffect(() => { search('') }, [search])

  const handleAdd = async (user: any) => {
    setAdding(user.id)
    setFeedback(null)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: user.id }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        setFeedback({ id: user.id, ok: true, msg: j.pending ? '¡Solicitud enviada!' : '¡Contacto agregado!' })
        if (!j.pending) onAdded(j.contact || user)
        setResults(prev => prev.filter(u => u.id !== user.id))
      } else {
        setFeedback({ id: user.id, ok: false, msg: j.error || 'Error al agregar' })
      }
    } catch {
      setFeedback({ id: user.id, ok: false, msg: 'Error de conexión' })
    }
    setAdding(null)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-md shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14]">
              <UserPlus size={17} />
            </div>
            <div>
              <h2 className="text-white font-bold font-heading text-base leading-none">Agregar Contacto</h2>
              <p className="text-[#94a3b8] text-[10px] mt-1 uppercase tracking-widest opacity-60">Ingresa el PIN de 6 caracteres</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#39FF14] transition-colors">
              {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
            <input
              autoFocus
              type="text"
              maxLength={6}
              placeholder="Ej: A1B2C3"
              className="w-full cyber-input pl-11 h-11 text-sm uppercase tracking-widest font-mono font-bold"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-2">
          {results.length === 0 && !loading && (
            <div className="text-center py-10 text-[#94a3b8] text-sm opacity-50">
              {query.length === 6 ? 'Usuario no encontrado' : 'Ingresa los 6 caracteres del PIN'}
            </div>
          )}
          {results.map(u => {
            const initials = (u.nombre_mostrar || u.username || '?').charAt(0).toUpperCase()
            const avatarSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23131a27'/><text x='50%' y='60%' font-size='28' text-anchor='middle' fill='%2339FF14' font-family='Outfit,sans-serif' font-weight='bold'>${encodeURIComponent(initials)}</text></svg>`
            const fb = feedback?.id === u.id ? feedback : null

            return (
              <div key={u.id} className="glass-card flex items-center gap-3 p-3 rounded-2xl">
                <img
                  src={u.avatar_url || avatarSvg}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{u.nombre_mostrar || u.username}</div>
                  <div className="text-[#94a3b8] text-[10px] opacity-50 font-mono">@{u.username}</div>
                </div>
                {fb ? (
                  <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${fb.ok ? 'text-[#39FF14]' : 'text-[#FF3131]'}`}>
                    {fb.ok ? <Check size={13} /> : <AlertCircle size={13} />} {fb.msg}
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(u)}
                    disabled={adding === u.id}
                    className="btn-neon py-2 px-4 text-[11px] tracking-widest disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {adding === u.id ? <Loader size={13} className="animate-spin" /> : <UserPlus size={13} />}
                    Agregar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Requests Modal ──────────────────────────────────────────────────────── */
function RequestsModal({ onClose, requests, onAccept, onReject }: { onClose: () => void; requests: any[]; onAccept: (u: any) => void; onReject: (id: string) => void }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAccept = async (u: any) => {
    setProcessing(u.id)
    try {
      const res = await fetch('/api/contacts/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: u.id })
      })
      const j = await res.json()
      if (j.ok) onAccept(j.contact || u)
    } finally { setProcessing(null) }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/contacts/requests?id=${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (j.ok) onReject(id)
    } finally { setProcessing(null) }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14]">
              <Bell size={17} />
            </div>
            <div>
              <h2 className="text-white font-bold font-heading text-base leading-none">Solicitudes</h2>
              <p className="text-[#94a3b8] text-[10px] mt-1 uppercase tracking-widest opacity-60">{requests.length} pendientes</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 overflow-y-auto space-y-2">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm opacity-50">No tienes solicitudes pendientes.</div>
          ) : requests.map(u => (
            <div key={u.id} className="glass-card p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={u.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 128 128'><rect width='128' height='128' fill='%23131a27'/><text x='50%' y='60%' font-size='50' text-anchor='middle' fill='%2339FF14' font-family='Outfit, sans-serif' font-weight='bold' style='opacity: 0.8'>${u.username.charAt(0).toUpperCase()}</text></svg>`}
                  alt="Avatar" className="w-10 h-10 rounded-full border border-white/10"
                />
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{u.nombre_mostrar || u.username}</div>
                  <div className="text-[#94a3b8] text-[10px] font-mono tracking-wider opacity-60">@{u.username}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {processing === u.id ? <Loader size={16} className="animate-spin text-[#39FF14] mr-2" /> : (
                  <>
                    <button onClick={() => handleAccept(u)} className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14] hover:bg-[#39FF14]/20 transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => handleReject(u.id)} className="p-2 rounded-lg bg-[#FF3131]/10 text-[#FF3131] hover:bg-[#FF3131]/20 transition-colors">
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────────── */
function DeleteConfirmModal({ contact, onConfirm, onCancel }: { contact: any; onConfirm: () => void; onCancel: () => void }) {
  const initials = (contact.nombre_mostrar || contact.username || '?').charAt(0).toUpperCase()
  const avatarSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23131a27' /><text x='50%' y='60%' font-size='28' text-anchor='middle' fill='%2339FF14' font-family='Outfit,sans-serif' font-weight='bold'>${encodeURIComponent(initials)}</text></svg>`

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onCancel}>
      <div className="glass-panel w-full max-w-sm p-6 animate-scale-in text-center" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#FF3131]/40 mb-4 shadow-[0_0_20px_rgba(255,49,49,0.2)]">
          <img src={contact.avatar_url || avatarSvg} alt="" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-white font-bold font-heading text-lg mb-1">¿Eliminar contacto?</h3>
        <p className="text-[#94a3b8] text-sm mb-6">
          <span className="text-white font-semibold">{contact.nombre_mostrar || contact.username}</span> será eliminado de tu lista. Los mensajes no se borran.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[#94a3b8] hover:text-white text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-[#FF3131]/15 border border-[#FF3131]/30 text-[#FF3131] hover:bg-[#FF3131]/25 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={15} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Chat Page ──────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [showRequests, setShowRequests] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMessage, setEditingMessage] = useState<any | null>(null)
  const [isPeerTyping, setIsPeerTyping] = useState(false)
  const typingTimeoutRef = useRef<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set())

  const markAsRead = useCallback(async (peerId: string) => {
    if (!peerId) return
    try {
      await fetch(`/api/messages?peer_id=${peerId}`, { method: 'PATCH', credentials: 'include' })
    } catch (err) {
      console.error('[ChatPage] Error marking as read:', err)
    }
  }, [])

  const scrollToMessage = useCallback((id: string | number) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('animate-highlight')
      setTimeout(() => el.classList.remove('animate-highlight'), 2000)
    }
  }, [])

  useEffect(() => {
    if (selectedPeer) {
      setIsSidebarOpen(false)
      // Marcar como leídos localmente
      setContacts(prev => prev.map(c => c.id === selectedPeer ? { ...c, unread_msgs: 0 } : c))
      // Notificar al backend
      markAsRead(selectedPeer)
    }
  }, [selectedPeer, markAsRead])

  // =========================================================================
  // Bloqueo de Aplicación (App Lock)
  // =========================================================================
  const isMediaInteractingRef = useRef(false)
  const [initialLockChecked, setInitialLockChecked] = useState(false)

  useEffect(() => {
    if (!user) return

    // Bloquear inmediatamente al iniciar sesión/cargar la app si tiene PIN
    if (!initialLockChecked) {
      if (user.lock_key_hash) setIsLocked(true)
      setInitialLockChecked(true)
    }

    if (!user.lock_key_hash) return

    const onVisibilityChange = () => {
      if (document.hidden) setIsLocked(true)
    }

    const onWindowBlur = () => {
      if (isMediaInteractingRef.current) return
      setIsLocked(true)
    }

    const onWindowFocus = () => {
      setTimeout(() => { isMediaInteractingRef.current = false }, 500)
    }

    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Evalúa si estaba oculto al montar
    if (document.hidden) setIsLocked(true)

    return () => {
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('focus', onWindowFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user?.lock_key_hash])

  const handleRealtime = useCallback((newMessage: any) => {
    if (!user) return
    const involvesMe = newMessage.sender_id === user.id || newMessage.receiver_id === user.id
    if (!involvesMe) return
    if (selectedPeer) {
      const involvesPeer = newMessage.sender_id === selectedPeer || newMessage.receiver_id === selectedPeer
      if (!involvesPeer) return
    }
    setMessages(prev => {
      // Si es una actualización (como is_read: true)
      if (newMessage._eventType === 'UPDATE') {
        return prev.map(m => m.id === newMessage.id ? { ...m, ...newMessage } : m)
      }

      // Inserción de un nuevo mensaje (INSERT)
      const idx = prev.findIndex(m =>
        m.optimistic &&
        m.sender_id === newMessage.sender_id &&
        m.receiver_id === newMessage.receiver_id &&
        m.message_type === newMessage.message_type &&
        (m.content === newMessage.content || (m.image_url && newMessage.image_url && m.image_url === newMessage.image_url))
      )
      if (idx !== -1) { const copy = [...prev]; copy[idx] = newMessage; return copy }
      if (prev.some(m => m.id === newMessage.id)) return prev
      const updated = [...prev, newMessage]
      if (newMessage.sender_id === selectedPeer) {
        markAsRead(selectedPeer)
      }
      return updated
    })
  }, [user?.id, selectedPeer])

  useRealtimeMessages(handleRealtime, user?.id)

  // Subscripción a estado de escritura (Typing Broadcast)
  useEffect(() => {
    if (!user || !selectedPeer) return
    const channel = supabase.channel(`typing:${user.id}`)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.sender_id === selectedPeer) {
          setIsPeerTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 3000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, selectedPeer, supabase])

  // Emitir señal de Escribiendo
  const handleUserTyping = useCallback(() => {
    if (!user || !selectedPeer) return
    supabase.channel(`typing:${selectedPeer}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender_id: user.id }
    })
  }, [user, selectedPeer, supabase])

  // Load contacts & messages
  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const res = await fetch('/api/contacts', { credentials: 'include' })
        const j = await res.json()
        if (res.ok && j.ok) setContacts(j.contacts || [])
      } catch { }

      if (selectedPeer) {
        const msgs = await fetch(`/api/messages?peer=${selectedPeer}`, { credentials: 'include' }).then(r => r.json())
        if (msgs.ok) setMessages(msgs.messages || [])
      } else {
        setMessages([])
      }
    }
    load()
  }, [user, selectedPeer])

  // Polling for messages
  useEffect(() => {
    if (!selectedPeer) return
    let mounted = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?peer=${selectedPeer}&t=${Date.now()}`, { credentials: 'include', cache: 'no-store' })
        const j = await res.json()
        if (mounted && res.ok && j.ok) {
          const fetchedMessages = j.messages || []
          // Aplicar borrado suave local a los mensajes traídos del servidor que aún no reflejen el cambio
          const mergedMessages = fetchedMessages.map((m: any) =>
            deletedMessageIds.has(String(m.id))
              ? { ...m, is_deleted: true, content: '', image_url: null, sticker_url: null, audio_url: null }
              : m
          )
          setMessages(mergedMessages)
        }
      } catch { }
    }, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, [selectedPeer, deletedMessageIds])

  // Polling for contact requests
  useEffect(() => {
    if (!user) return
    let mounted = true
    const checkReqs = async () => {
      try {
        const res = await fetch('/api/contacts/requests', { credentials: 'include' })
        const j = await res.json()
        if (mounted && res.ok && j.ok) setRequests(j.requests || [])
      } catch { }
    }
    checkReqs()
    const interval = setInterval(checkReqs, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user])

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (content: string, type: 'text' | 'image' | 'sticker' | 'audio' = 'text', url?: string, replyToId?: string, expiresAt?: string) => {
    if (!user || !selectedPeer) return
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const optimisticMsg: any = {
      id: tmpId, sender_id: user.id, receiver_id: selectedPeer,
      content, message_type: type,
      image_url: type === 'image' ? url : null,
      sticker_url: type === 'sticker' ? url : null,
      audio_url: type === 'audio' ? url : null,
      reply_to_id: replyToId || null,
      expires_at: expiresAt || null,
      created_at: new Date().toISOString(), optimistic: true,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setReplyingTo(null)
    try {
      await fetch('/api/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedPeer,
          content,
          message_type: type,
          image_url: type === 'image' ? url : null,
          sticker_url: type === 'sticker' ? url : null,
          audio_url: type === 'audio' ? url : null,
          reply_to_id: replyToId,
          expires_at: expiresAt || null
        }),
      })
    } catch {
      setMessages(prev => prev.map(m => m.id === tmpId ? { ...m, failed: true } : m))
    }
  }

  const deleteMessage = async (id: string | number) => {
    console.log('[ChatPage] deleteMessage called for:', id)
    const sid = String(id)

    // Optimistic UI: mark as deleted locally immediately
    setDeletedMessageIds(prev => new Set(prev).add(sid))
    setMessages(prev => prev.map(m => String(m.id) === sid ? { ...m, is_deleted: true, content: '', image_url: null, sticker_url: null, audio_url: null } : m))

    if (sid.startsWith('tmp-')) {
      setMessages(prev => prev.filter(m => String(m.id) !== sid))
      return
    }

    try {
      console.log('[ChatPage] Sending DELETE request for:', sid)
      const res = await fetch(`/api/messages?id=${sid}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        console.error('[ChatPage] DELETE failed with status:', res.status)
        // Only revert if it's a critical failure (optional logic, keeping it simple for now)
      } else {
        console.log('[ChatPage] DELETE success for:', sid)
      }
    } catch (err) {
      console.error('[ChatPage] DELETE fetch error:', err)
    }
  }

  const updateMessage = async (id: string, newContent: string) => {
    if (String(id).startsWith('tmp-')) return // No edites tmp messages

    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent, is_edited: true } : m))
    setEditingMessage(null)
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, content: newContent })
      })
    } catch { }
  }

  const clearConversation = async () => {
    if (!selectedPeer) return
    const contact = contacts.find(c => c.id === selectedPeer)
    const name = contact?.nombre_mostrar || contact?.username || 'este contacto'
    if (!window.confirm(`¿Estás seguro de que quieres borrar TODA la conversación con ${name}? Esta acción no se puede deshacer.`)) return

    try {
      const res = await fetch(`/api/messages?peer_id=${selectedPeer}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        setMessages([])
        setReplyingTo(null)
      }
    } catch (err) {
      console.error('[ChatPage] Error clearing conversation:', err)
    }
  }

  const handleDeleteContact = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE', credentials: 'include' })
      const j = await res.json()
      if (res.ok && j.ok) {
        setContacts(prev => prev.filter(c => c.id !== deleteTarget.id))
        if (selectedPeer === deleteTarget.id) { setSelectedPeer(null); setMessages([]) }
      }
    } catch { }
    setDeleteTarget(null)
  }

  const filteredContacts = contacts.filter(c =>
    (c.nombre_mostrar || c.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const makeAvatarUrl = (u: any, size = 64) => {
    const initial = (u?.nombre_mostrar || u?.username || '?').charAt(0).toUpperCase()
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='${size}' height='${size}' fill='%23131a27' /><text x='50%' y='60%' font-size='${Math.round(size * 0.44)}' text-anchor='middle' fill='%2339FF14' font-family='Outfit,sans-serif' font-weight='bold' style='opacity:0.8'>${encodeURIComponent(initial)}</text></svg>`
  }

  return (
    <>
      {/* App Lock Screen se monta encima de TODO si está activo, bloqueando el renderizado principal */}
      {isLocked && user?.lock_key_hash ? (
        <AppLockScreen
          lockKeyHash={user.lock_key_hash}
          onUnlock={() => setIsLocked(false)}
        />
      ) : (
        <div className="flex h-[100dvh] w-full bg-[#070b14] md:p-4 font-sans overflow-hidden">
          <div className="glass-panel flex w-full h-full overflow-hidden shadow-2xl relative">

            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div className="md:hidden fixed inset-0 mobile-overlay z-40 transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className={`fixed md:relative z-50 w-[280px] md:w-80 h-full flex flex-col border-r border-white/5 bg-[#0d111c]/95 md:bg-white/[0.01] sidebar-transition ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-transparent flex items-center justify-center font-bold text-[#39FF14] border border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                      B
                    </div>
                    <div>
                      <h1 className="font-heading text-white text-lg font-bold leading-none">Blackbox</h1>
                      <p className="text-[#94a3b8] text-[10px] uppercase tracking-widest mt-1 opacity-60">Secure Chat</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Add contact button */}
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/20 transition-all duration-300"
                      title="Agregar contacto"
                    >
                      <UserPlus size={17} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowRequests(true)}
                        className="relative w-9 h-9 rounded-xl bg-[#39FF14]/5 flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/10 transition-all duration-300"
                        title="Solicitudes de Amistad"
                      >
                        <Bell size={17} />
                        {requests.length > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF3131] rounded-full border-2 border-[#0d111c] shadow-[0_0_8px_rgba(255,49,49,0.8)] animate-pulse" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#94a3b8] hover:text-[#39FF14] hover:bg-white/10 transition-all duration-300"
                      title="Ajustes"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#94a3b8] hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Buscar contactos..."
                    className="w-full cyber-input text-sm pl-11 h-11"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#39FF14] transition-colors">
                    <Search size={16} />
                  </div>
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {filteredContacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#39FF14]/5 border border-[#39FF14]/10 flex items-center justify-center mb-4 text-[#39FF14]/40">
                      <UserPlus size={24} />
                    </div>
                    <p className="text-[#94a3b8] text-xs leading-relaxed opacity-60">
                      {searchTerm ? 'Sin resultados' : 'No tienes contactos aún. Usa el botón + para agregar.'}
                    </p>
                  </div>
                )}
                {filteredContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedPeer(c.id)}
                    className={`glass-card p-3 rounded-2xl cursor-pointer flex items-center gap-4 relative group ${selectedPeer === c.id ? 'bg-white/[0.05] border-[#39FF14]/40 shadow-[0_0_20px_rgba(57,255,20,0.05)]' : ''}`}
                  >
                    <div style={{ width: '48px', height: '48px' }} className="relative flex-shrink-0">
                      <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-[#39FF14]/40 to-transparent shadow-[0_0_10px_rgba(57,255,20,0.1)] overflow-hidden">
                        <img
                          src={c.avatar_url || makeAvatarUrl(c, 128)}
                          alt="avatar"
                          className="w-full h-full rounded-full object-cover border border-white/10 hover:scale-110 transition-transform duration-300"
                          onClick={e => {
                            e.stopPropagation()
                            setLightboxImage(c.avatar_url || makeAvatarUrl(c, 256))
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#39FF14] rounded-full border-2 border-[#0d111c] shadow-[0_0_8px_rgba(57,255,20,0.5)] z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold truncate text-sm leading-tight mb-1">{c.nombre_mostrar || c.username}</div>
                        {c.unread_msgs > 0 && selectedPeer !== c.id && (
                          <div className="min-w-[18px] h-[18px] bg-[#39FF14] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                            {c.unread_msgs > 99 ? '99+' : c.unread_msgs}
                          </div>
                        )}
                      </div>
                      <div className="text-[#94a3b8] text-[9px] truncate opacity-40 uppercase tracking-widest font-mono">@{c.username}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(c) }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-[#FF3131] transition-all transform hover:scale-110"
                      title="Eliminar contacto"
                    >
                      <Trash2 size={16} />
                    </button>
                    {selectedPeer === c.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#39FF14] rounded-r shadow-[0_0_15px_rgba(57,255,20,0.6)] animate-pulse" />
                    )}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-white/5 bg-[#0d111c] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: '42px', height: '42px' }} className="rounded-full p-[1.5px] bg-gradient-to-tr from-white/20 to-transparent overflow-hidden flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white/5 overflow-hidden">
                      <img src={user?.avatar_url || makeAvatarUrl(user, 64)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{user?.nombre_mostrar || user?.username}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-[#39FF14] font-bold uppercase tracking-wider opacity-90 font-mono bg-[#39FF14]/10 px-1.5 py-0.5 rounded border border-[#39FF14]/20">
                        PIN: {user?.pin || '------'}
                      </span>
                      <button
                        onClick={() => {
                          if (user?.pin) {
                            navigator.clipboard.writeText(user.pin);
                            // optional: could add a toast here
                          }
                        }}
                        className="text-[#94a3b8] hover:text-white transition-colors"
                        title="Copiar PIN"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); router.push('/login') }}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#94a3b8] hover:text-[#FF3131] hover:bg-white/10 transition-all duration-300"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </aside>

            {/* ── Chat Area ─────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col bg-[#070b14]/50 relative backdrop-blur-md">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#39FF14_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Chat Header */}
              <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.02] z-30">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
                  >
                    <Menu size={20} />
                  </button>

                  {selectedPeer ? (() => {
                    const peer = contacts.find(c => c.id === selectedPeer)
                    return (
                      <div className="flex items-center gap-4 animate-scale-in">
                        <div
                          className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#39FF14]/30 to-transparent cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => peer && setLightboxImage(peer.avatar_url || makeAvatarUrl(peer, 256))}
                        >
                          <div className="w-full h-full rounded-full bg-[#131a27] border border-white/10 overflow-hidden">
                            {peer?.avatar_url
                              ? <img src={peer.avatar_url} className="w-full h-full object-cover" />
                              : <img src={makeAvatarUrl(peer, 64)} className="w-full h-full object-cover" />
                            }
                          </div>
                        </div>
                        <div>
                          <h2 className="text-white font-bold text-base md:text-lg leading-tight">{peer?.nombre_mostrar || peer?.username}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${isPeerTyping ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.8)]'}`} />
                            <span className={`${isPeerTyping ? 'text-white' : 'text-[#39FF14]'} text-[10px] font-bold uppercase tracking-[0.2em] transition-colors`}>
                              {isPeerTyping ? 'Escribiendo...' : 'En Línea'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })() : (
                    <div className="text-[#94a3b8] font-medium tracking-wide flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      Blackbox Core
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 relative">
                  {showChatSearch && (
                    <input
                      type="text"
                      placeholder="Buscar en el chat..."
                      className="cyber-input text-sm h-9 px-3 w-40 md:w-60 absolute right-12 animate-fade-in"
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      autoFocus
                    />
                  )}
                  <button
                    onClick={() => {
                      setShowChatSearch(!showChatSearch)
                      if (showChatSearch) setChatSearch('')
                    }}
                    className={`flex w-9 h-9 rounded-xl ${showChatSearch ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-white/5 text-[#94a3b8] hover:text-white'} items-center justify-center transition-colors`}
                  >
                    <Search size={18} />
                  </button>
                  {selectedPeer && (
                    <button
                      onClick={clearConversation}
                      className="flex w-9 h-9 rounded-xl bg-white/5 items-center justify-center text-[#94a3b8] hover:text-[#FF3131] hover:bg-red-500/10 transition-colors border border-white/10 hover:border-red-500/30"
                      title="Borrar Chat"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 items-center justify-center text-[#94a3b8] hover:text-white transition-colors">
                    <Settings size={18} />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col z-10 custom-scrollbar" ref={chatBodyRef}>
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center animate-fade-in-up">
                    <div className="glass-card p-10 text-center max-w-sm rounded-[2.5rem] border-white/5">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#39FF14]/20 to-transparent rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#39FF14]/30 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
                        <Smile size={40} className="text-[#39FF14]" />
                      </div>
                      <h3 className="text-white font-heading text-2xl font-bold mb-3 tracking-tight">Canal Seguro</h3>
                      <p className="text-[#94a3b8] text-sm leading-relaxed opacity-80">
                        Las comunicaciones están cifradas. Inicia la conversación con este agente.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages
                    .filter(m => !m.is_deleted && !deletedMessageIds.has(String(m.id)))
                    .filter(m => !m.expires_at || new Date(m.expires_at) > new Date())
                    .filter(m => !chatSearch || (m.content && m.content.toLowerCase().includes(chatSearch.toLowerCase())))
                    .map(msg => (
                      <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-500 rounded-2xl">
                        <ChatMessage
                          message={msg}
                          isOwn={msg.sender_id === user?.id}
                          onReply={() => setReplyingTo(msg)}
                          replyMessage={msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null}
                          onScrollToReply={scrollToMessage}
                          onDelete={() => deleteMessage(msg.id)}
                          onEdit={() => setEditingMessage(msg)}
                        />
                      </div>
                    ))
                )}
              </div>

              {/* Chat Input */}
              <footer className="p-4 md:p-6 bg-[#070b14]/80 backdrop-blur-xl border-t border-white/5 z-30">
                <div className="max-w-5xl mx-auto">
                  <ChatInput
                    onSend={sendMessage}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    editingMessage={editingMessage}
                    onCancelEdit={() => setEditingMessage(null)}
                    onEditSubmit={updateMessage}
                    onTyping={handleUserTyping}
                    onMediaInteraction={() => { isMediaInteractingRef.current = true }}
                  />
                </div>
              </footer>
            </main>
          </div>

          {/* Modals */}
          {showSettings && <ProfileSettings onClose={() => setShowSettings(false)} />}
          {showAddContact && (
            <AddContactModal
              onClose={() => setShowAddContact(false)}
              onAdded={contact => setContacts(prev => [contact, ...prev])}
            />
          )}
          {showRequests && (
            <RequestsModal
              requests={requests}
              onClose={() => setShowRequests(false)}
              onAccept={(u) => {
                setContacts(prev => [...prev.filter(c => c.id !== u.id), u])
                setRequests(prev => prev.filter(r => r.id !== u.id))
              }}
              onReject={(id) => {
                setRequests(prev => prev.filter(r => r.id !== id))
              }}
            />
          )}
          {deleteTarget && (
            <DeleteConfirmModal
              contact={deleteTarget}
              onConfirm={handleDeleteContact}
              onCancel={() => setDeleteTarget(null)}
            />
          )}

          {/* Avatar Lightbox */}
          {lightboxImage && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10 animate-fade-in" onClick={() => setLightboxImage(null)}>
              <button className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors p-2" onClick={() => setLightboxImage(null)}>
                <X size={32} />
              </button>
              <div className="relative max-w-2xl w-full aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(57,255,20,0.15)] bg-[#0d111c] animate-scale-in" onClick={e => e.stopPropagation()}>
                <img src={lightboxImage} alt="Avatar Full" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <p className="text-[#39FF14] text-[10px] uppercase tracking-[0.4em] font-bold opacity-70">Identificación de Agente</p>
                  <h3 className="text-white text-2xl font-bold mt-2">Protocolo Blackbox</h3>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

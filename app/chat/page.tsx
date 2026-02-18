 'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import createClient from '../../lib/supabase'
import useRealtimeMessages from '../../hooks/useRealtimeMessages'
import ChatMessage from '../../components/ChatMessage'
import ChatInput from '../../components/ChatInput'
import useAuth from '../../hooks/useAuth'
import { Smile, Paperclip, Image as FeatherImage, ArrowUp, LogOut, Settings, Trash2, Menu, ArrowLeft } from 'react-feather'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const ProfileSettings = dynamic(() => import('../../components/ProfileSettings'), { ssr: false })

// initial placeholder removed — we'll use selectedPeer state to choose recipient

export default function ChatPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  // selectedPeer now stores the contact's public_id
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null)
  // sidebar open state for mobile
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  // on client, open the sidebar by default for small screens so contacts are visible
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const mw = window.innerWidth
        if (mw < 900) {
          setSidebarOpen(true)
        }
      }
    } catch (e) {}
  }, [])

  // keep sidebar visible when no peer is selected on mobile; close when a peer is selected
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 900) {
        setSidebarOpen(!selectedPeer)
      }
    } catch (e) {}
  }, [selectedPeer])
  const [showSettings, setShowSettings] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const handleRealtime = useCallback((newMessage: any) => {
    // debug
    try {
      // eslint-disable-next-line no-console
      console.debug('[handleRealtime] got message', { newMessage, selectedPeer, userId: user?.id })
    } catch (e) {}

    // only append messages that involve the current user (public ids)
    if (!user) return
    const involvesMe = newMessage.sender_public_id === user.public_id || newMessage.receiver_public_id === user.public_id
    if (!involvesMe) {
      // eslint-disable-next-line no-console
      console.debug('[handleRealtime] ignored: not involving me')
      return
    }

    // if a peer is selected, only append messages that are part of the current conversation
    if (selectedPeer) {
      const involvesPeer = newMessage.sender_public_id === selectedPeer || newMessage.receiver_public_id === selectedPeer
      if (!involvesPeer) {
        // eslint-disable-next-line no-console
        console.debug('[handleRealtime] ignored: not part of selected peer conversation', { selectedPeer })
        return
      }
    }

    setMessages((prev) => {
      // if we have an optimistic message that matches this real one, replace it
      const idx = prev.findIndex((m) => m.optimistic && m.sender_public_id === newMessage.sender_public_id && m.receiver_public_id === newMessage.receiver_public_id && m.message_type === newMessage.message_type && (m.content === newMessage.content || (m.image_url && newMessage.image_url && m.image_url === newMessage.image_url)))
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = newMessage
        return copy
      }
      // avoid duplicate ids
      if (prev.some((m) => m.id === newMessage.id)) return prev
      return [...prev, newMessage]
    })
  }, [user?.id, selectedPeer])

  useRealtimeMessages(handleRealtime, user?.public_id)

  // load contacts and initial messages when user changes
  useEffect(() => {
    if (!user) return

  const load = async () => {
      // contacts
      try {
        const res = await fetch('/api/contacts', { credentials: 'include' })
        const j = await res.json()
        if (res.ok && j.ok) setContacts(j.contacts || [])
      } catch (err) {
        // ignore
      }

      // if a peer already selected, load conversation
      if (selectedPeer) {
        const msgs = await fetch(`/api/messages?peer=${selectedPeer}`, { credentials: 'include' }).then((r) => r.json())
        if (msgs.ok) setMessages(msgs.messages || [])
      } else {
        setMessages([])
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPeer])

  const sendMessage = async (content: string, type: 'text' | 'image' | 'sticker' = 'text', url?: string) => {
    if (!user || !selectedPeer) return
    // optimistic UI: append a temporary message so sender sees it immediately
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const optimisticMsg: any = {
      id: tmpId,
      sender_public_id: user.public_id,
      receiver_public_id: selectedPeer,
      content,
      message_type: type,
      image_url: type === 'image' ? url : null,
      sticker_url: type === 'sticker' ? url : null,
      created_at: new Date().toISOString(),
      optimistic: true,
    }
  setMessages((prev) => [...prev, optimisticMsg])

    try {
      const body = {
        receiver_id: selectedPeer,
        content,
        message_type: type,
        image_url: type === 'image' ? url : null,
        sticker_url: type === 'sticker' ? url : null,
      }
  await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      // actual message will arrive through realtime subscription and replace optimistic one
    } catch (err) {
      console.error('sendMessage error', err)
      // optionally mark the optimistic message as failed
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...m, failed: true } : m)))
    }
  }

  const handleDeleteContact = async (contactId: string) => {
  if (!contactId) return
    const ok = window.confirm('¿Eliminar este contacto? Esta acción no se puede deshacer.')
    if (!ok) return

    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(contactId)}`, { method: 'DELETE', credentials: 'include' })
      const j = await res.json()
        if (res.ok && j.ok) {
        setContacts((prev) => prev.filter((c) => c.public_id !== contactId))
        if (selectedPeer === contactId) {
          setSelectedPeer(null)
          setMessages([])
        }
      } else {
        console.error('Failed to delete contact', j)
        alert(j?.error || 'No se pudo eliminar el contacto')
      }
    } catch (err) {
      console.error(err)
      alert('Error al eliminar contacto')
    }
  }

  // auto-scroll to bottom when messages change
  useEffect(() => {
    if (!chatBodyRef.current) return
    try {
      // scroll to bottom smoothly
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    } catch (e) {
      // ignore
    }
  }, [messages])

  // polling fallback: fetch messages periodically in case realtime doesn't deliver
  useEffect(() => {
    if (!selectedPeer) return
    let mounted = true
    let interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?peer=${selectedPeer}`, { credentials: 'include' })
        const j = await res.json()
        if (!mounted) return
        if (res.ok && j.ok) {
          // replace messages with server canonical list (keeps order)
          setMessages(j.messages || [])
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 2000)

    // run an immediate fetch once
    ;(async () => {
      try {
        const res = await fetch(`/api/messages?peer=${selectedPeer}`, { credentials: 'include' })
        const j = await res.json()
        if (mounted && res.ok && j.ok) setMessages(j.messages || [])
      } catch (e) {}
    })()

    return () => {
      mounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeer])

  return (
    <div className="container" style={{ height: '100vh', boxSizing: 'border-box', paddingTop: 12 }}>
  <div className="card" style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>
          <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="header">
            <div className="brand">
              <div className="logo">R</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar next to title; clicking opens full-size modal */}
                <img
                  src={user?.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23e8eefc'/><text x='50%' y='54%' font-size='28' text-anchor='middle' fill='%2364758b' font-family='sans-serif'>${encodeURIComponent((user?.display_name || 'U').charAt(0).toUpperCase())}</text></svg>`}
                  alt="Mi avatar"
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(15,23,42,0.04)' }}
                  onClick={() => setShowAvatar(true)}
                />
                <div>
                  <div className="h-title">Chats privados</div>
                  <div className="h-sub">{user?.display_name || user?.username || 'Usuario'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="search">
            <input placeholder="Buscar chats" />
            <button className="btn">+</button>
          </div>
          <div>
            {contacts.map((c) => (
              <div key={c.public_id} className="contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8, background: selectedPeer === c.public_id ? 'rgba(0,0,0,0.03)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }} onClick={() => { setSelectedPeer(c.public_id); setSidebarOpen(false) }}>
                  <img src={c.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='%23e8eefc'/><text x='50%' y='54%' font-size='56' text-anchor='middle' fill='%2364758b' font-family='sans-serif'>${encodeURIComponent((c.display_name || '?').charAt(0).toUpperCase())}</text></svg>`} alt="avatar" />
                  <div className="meta">
                    <div className="name">{c.display_name}</div>
                    <div className="small">{c.public_id}</div>
                  </div>
                </div>

                <div style={{ marginLeft: 8, display: 'flex', gap: 6 }}>
                  <button
                    className="attach-btn"
                    title="Eliminar contacto"
                    aria-label={`Eliminar ${c.display_name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteContact(c.public_id)
                      }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
          {/* mobile backdrop */}
          <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        <main className="chat-area" style={{ display: 'flex', flexDirection: 'column', background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 40px), #efe4db' }}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* mobile toggle button */}
              <button className="attach-btn mobile-toggle" aria-label="Abrir chats" onClick={() => setSidebarOpen(true)} style={{ marginRight: 6 }}>
                <Menu size={18} />
              </button>
              {/* back button when in mobile and a peer selected */}
              {selectedPeer && (
                <button className="attach-btn mobile-toggle" aria-label="Volver" onClick={() => { setSelectedPeer(null); setSidebarOpen(true) }} style={{ marginRight: 6 }}>
                  <ArrowLeft size={18} />
                </button>
              )}

              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e6eefc' }} />
              <div>
                <div className="name">{contacts.find((c) => c.public_id === selectedPeer)?.display_name || 'Selecciona un chat'}</div>
                <div className="small">{selectedPeer ? 'En línea' : ''}</div>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Selecciona un chat</div>
              <button className="attach-btn" title="Ajustes" aria-label="Ajustes" onClick={() => setShowSettings(true)}>
                <Settings size={16} />
              </button>
              <button
                className="attach-btn"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                onClick={async () => {
                  try {
                    await signOut()
                  } finally {
                    router.push('/login')
                  }
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
            {messages.length === 0 ? (
              <div className="empty-state-wrap">
                <div className="empty-state">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>La conversación está vacía.</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Envía el primer mensaje para iniciar el chat.</div>
                </div>
              </div>
            ) : (
              <div className="msg-row" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} isOwn={msg.sender_public_id === user?.public_id} />
                ))}
              </div>
            )}
          </div>

          <div className="chat-input-wrap" style={{ padding: 12, borderTop: '1px solid rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center' }}>
            <div className="bubble-input" style={{ flex: 1 }}>
              {/* left icons */}
              <button className="attach-btn" title="Emoji" style={{ background: 'transparent' }} aria-label="Emoji"><Smile size={18} /></button>
              <button className="attach-btn" title="Adjuntar" aria-label="Adjuntar"><Paperclip size={18} /></button>
              <button className="attach-btn" title="Imagen" aria-label="Imagen"><FeatherImage size={18} /></button>

              <ChatInput onSend={sendMessage} />
            </div>

            {/* decorative send removed — ChatInput contains the single send button */}
          </div>
        </main>
      </div>
      <div style={{ height: 18 }} />
      {showSettings && <ProfileSettings onClose={() => setShowSettings(false)} />}

      {/* Avatar full-view modal */}
      {showAvatar && (
        <div className="modal-backdrop" onClick={() => setShowAvatar(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={user?.avatar_url || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='%23e8eefc'/><text x='50%' y='54%' font-size='180' text-anchor='middle' fill='%2364758b' font-family='sans-serif'>${encodeURIComponent((user?.display_name || 'U').charAt(0).toUpperCase())}</text></svg>`}
                alt="Avatar completo"
                style={{ maxWidth: 'min(90vw,720px)', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setShowAvatar(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 12 }} />
      <div className="footer">Interfaz visual - sin lógica. Copia para maqueta.</div>
    </div>
  )
}

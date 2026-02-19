'use client'

import React, { useState, useEffect, useRef } from 'react'
import createClient from '../lib/supabase'
import { Paperclip, ArrowUp, Trash2, Image as FeatherImage, Smile, Star } from 'react-feather'

export type MessageType = 'text' | 'image' | 'sticker'

export default function ChatInput({ onSend }: { onSend: (content: string, type?: MessageType, url?: string) => Promise<void> | void }) {
  const [content, setContent] = useState('')
  const supabase = createClient()
  const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'images'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // a small sticker pack represented as emoji (could be replaced by image URLs)
  const STICKERS = ['😀','😂','😍','🥳','🤩','😎','🤖','👾','🌈','🔥','💥','🏆']

  const handleSend = async () => {
    if (!content.trim()) return
    onSend(content.trim(), 'text')
    setContent('')
  }

  const uploadImage = async (file: File) => {
    try {
      // clear the temporary ignore-lock flag when we start uploading
      try { sessionStorage.removeItem('bb_ignore_lock') } catch (e) {}
      // upload via server endpoint to avoid RLS/ownership issues
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const j = await res.json()
      if (!res.ok || !j.ok) return
      try { sessionStorage.removeItem('bb_ignore_lock') } catch (e) {}
      onSend('', 'image', j.publicURL)
    } catch (err) {
      // handle in production
      try { sessionStorage.removeItem('bb_ignore_lock') } catch (e) {}
    }
  }

  // helpers to set/clear a per-tab ignore-lock flag while file picker is active
  const setIgnoreLock = (on: boolean) => {
    try {
      if (on) sessionStorage.setItem('bb_ignore_lock', '1')
      else sessionStorage.removeItem('bb_ignore_lock')
    } catch (e) {}
  }

  useEffect(() => {
    // revoke preview url when component unmounts or file changes
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="input-bar" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* attach / file input (single attach icon) */}
        <label className="attach-btn" title="Adjuntar imagen" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {/* hidden file input - add capture for mobile camera */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onClick={() => {
                // set an ignore flag so AppLock will not lock while native file picker is open
                setIgnoreLock(true)
              }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0]
                if (f) {
                  setSelectedFile(f)
                  const u = URL.createObjectURL(f)
                  setPreviewUrl(u)
                }
                // file picker closed (either with selection or cancelled) — clear ignore
                setIgnoreLock(false)
              }}
            />
          <Paperclip size={18} />
          {selectedFile && <span className="file-badge">1</span>}
        </label>

        {/* emoji toggle */}
        <button className="attach-btn" title="Emoji" style={{ background: 'transparent' }} aria-label="Emoji" onClick={() => { setShowEmoji((s) => !s); setShowStickers(false); }}>
          <Smile size={18} />
        </button>

        {/* sticker toggle */}
        <button className="attach-btn" title="Stickers" style={{ background: 'transparent' }} aria-label="Stickers" onClick={() => { setShowStickers((s) => !s); setShowEmoji(false); }}>
          <Star size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginLeft: 8 }}>
        <input
          className="flex-1 rounded-[22px] border px-4 py-3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (selectedFile) {
                // upload selected file instead of sending text
                uploadImage(selectedFile)
                setSelectedFile(null)
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }
                setContent('')
              } else {
                handleSend()
              }
            }
          }}
          placeholder="Mensaje..."
        />
        {previewUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={previewUrl} alt="preview" className="img-preview" />
            <button
              className="small"
              onClick={() => {
                setSelectedFile(null)
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }
              }}
              aria-label="Quitar imagen"
              title="Quitar imagen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <button
        className="send-btn"
        onClick={async () => {
          if (selectedFile) {
            await uploadImage(selectedFile)
              setSelectedFile(null)
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }
              setContent('')
              try { sessionStorage.removeItem('bb_ignore_lock') } catch (e) {}
            return
          }
          handleSend()
        }}
        aria-label="Enviar"
        style={{ marginLeft: 8 }}
      >
        <ArrowUp size={18} />
      </button>

      {/* Emoji picker popover */}
      {showEmoji && (
        <div className="popover" style={{ position: 'absolute', bottom: '56px', left: 8, zIndex: 60, background: 'var(--bg)', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
          {/* a small curated emoji list for quick insertion */}
          {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😍','🤩','😘','😎','🤓','🤖','🙃','😉','😇','🤗','🤔','🤭','👏','🙏','👍','👎','🔥','💯','🎉','✨'].map((e) => (
            <button key={e} onClick={() => { setContent((c) => c + e); setShowEmoji(false); }} className="emoji-btn" style={{ fontSize: 18, padding: 6, background: 'transparent', border: 'none' }} aria-label={`Insert ${e}`}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Sticker picker popover */}
      {showStickers && (
        <div className="popover" style={{ position: 'absolute', bottom: '56px', left: 64, zIndex: 60, background: 'var(--bg)', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {STICKERS.map((s) => (
              <button key={s} onClick={() => { onSend('', 'sticker', s); setShowStickers(false); }} title={`Sticker ${s}`} style={{ fontSize: 28, padding: 6, background: 'transparent', border: 'none' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

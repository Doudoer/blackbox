'use client'

import React, { useState, useEffect } from 'react'
import createClient from '../lib/supabase'
import { Paperclip, Image as FeatherImage, Smile, ArrowUp, Trash2 } from 'react-feather'

export type MessageType = 'text' | 'image' | 'sticker'

export default function ChatInput({ onSend }: { onSend: (content: string, type?: MessageType, url?: string) => Promise<void> | void }) {
  const [content, setContent] = useState('')
  const supabase = createClient()
  const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'images'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleSend = async () => {
    if (!content.trim()) return
    onSend(content.trim(), 'text')
    setContent('')
  }

  const uploadImage = async (file: File) => {
    try {
      // upload via server endpoint to avoid RLS/ownership issues
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const j = await res.json()
      if (!res.ok || !j.ok) return
      onSend('', 'image', j.publicURL)
    } catch (err) {
      // handle in production
    }
  }

  useEffect(() => {
    // revoke preview url when component unmounts or file changes
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="input-bar">
  <label className="attach-btn" title="Adjuntar imagen" style={{ position: 'relative' }}>
        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0]
            if (f) {
              setSelectedFile(f)
              const u = URL.createObjectURL(f)
              setPreviewUrl(u)
            }
          }}
        />
        <Paperclip size={18} />
        {selectedFile && <span className="file-badge">1</span>}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
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
            return
          }
          handleSend()
        }}
        aria-label="Enviar"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  )
}

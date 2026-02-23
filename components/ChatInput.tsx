'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Paperclip, Smile, ArrowUp, Trash2, X, Image as FeatherImage, Mic, Square, Clock } from 'react-feather'
import EmojiPicker, { Theme, EmojiClickData, EmojiStyle } from 'emoji-picker-react'
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'

export type MessageType = 'text' | 'image' | 'sticker' | 'audio'

// API KEY Giphy developer test key
const gf = new GiphyFetch('sXpGFDGZs0Dv1mmxFvYaGUvYwAHGURQ3')

export default function ChatInput({
  onSend,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEditSubmit,
  onTyping,
  onMediaInteraction
}: {
  onSend: (content: string, type?: MessageType, url?: string, replyToId?: string, expiresAt?: string) => Promise<void> | void;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
  onEditSubmit?: (id: string, newContent: string) => void | Promise<void>;
  onTyping?: () => void;
  onMediaInteraction?: () => void;
}) {
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  // Media Popover State
  const [showPopup, setShowPopup] = useState(false)
  const [popupTab, setPopupTab] = useState<'emoji' | 'giphy'>('emoji')
  const popupRef = useRef<HTMLDivElement>(null)

  // Timer State (Mensajes Efímeros)
  const [showTimerPopup, setShowTimerPopup] = useState(false)
  const [expiresIn, setExpiresIn] = useState<number>(0) // mins: 0=off
  const timerOptions = [{ l: 'Off', v: 0 }, { l: '1 Min', v: 1 }, { l: '1 Hora', v: 60 }, { l: '1 Día', v: 1440 }]

  // Cargar contenido cuando entramos en modo edición
  useEffect(() => {
    if (editingMessage && editingMessage.message_type === 'text') {
      setContent(editingMessage.content || '')
    } else if (!editingMessage) {
      setContent('')
    }
  }, [editingMessage])

  const handleSend = async () => {
    if (!content.trim() && !selectedFile) return

    let expiresAt: string | undefined
    if (expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60000).toISOString()
    }

    if (editingMessage && onEditSubmit) {
      await onEditSubmit(editingMessage.id, content.trim())
    } else if (selectedFile) {
      await uploadFile(selectedFile, expiresAt)
    } else {
      onSend(content.trim(), 'text', undefined, replyingTo?.id, expiresAt)
    }
    setContent('')
  }

  const uploadFile = async (file: File, expiresAt?: string) => {
    try {
      const res = await fetch('/api/upload?type=chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const j = await res.json()
      if (!res.ok || !j.ok) return

      const type = file.type.startsWith('audio') ? 'audio' : 'image'
      onSend('', type, j.publicURL, replyingTo?.id, expiresAt)
    } catch (err) {
      console.error('File upload failed', err)
    } finally {
      setSelectedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const startRecording = async () => {
    if (onMediaInteraction) onMediaInteraction();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], 'voicenote.webm', { type: 'audio/webm' })

        let expiresAt: string | undefined
        if (expiresIn > 0) {
          expiresAt = new Date(Date.now() + expiresIn * 60000).toISOString()
        }
        await uploadFile(file, expiresAt)
        stream.getTracks().forEach(t => t.stop())
      }

      mr.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(p => p + 1)
      }, 1000)
    } catch (err) {
      console.error('Error acceding mic', err)
      alert("No se pudo acceder al micrófono para la nota de voz.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  // Clicks fuera del popup para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }
    if (showPopup) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent(prev => prev + emojiData.emoji)
  }

  const onGiphyClick = (gif: any, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault()
    onSend('', 'sticker', gif.images.original.url, replyingTo?.id)
    setShowPopup(false)
  }

  return (
    <div className="flex flex-col w-full relative">
      {/* Indicador de "Respondiendo a..." */}
      {replyingTo && !editingMessage && (
        <div className="flex items-center justify-between bg-[#39FF14]/10 border-l-4 border-[#39FF14] p-2 px-3 rounded-t-xl mb-1 text-sm animate-fade-in">
          <div>
            <span className="text-[#39FF14] font-semibold text-xs uppercase tracking-wider">
              {replyingTo.sender_id === replyingTo.receiver_id ? 'Respondiendo' : 'Añadir respuesta'}
            </span>
            <p className="text-white/70 truncate w-64 md:w-96">
              {replyingTo.message_type === 'image' ? '📸 Imagen' : replyingTo.message_type === 'sticker' ? '✨ Sticker' : replyingTo.message_type === 'audio' ? '🎤 Nota de voz' : replyingTo.content}
            </p>
          </div>
          <button onClick={onCancelReply} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Indicador de "Editando..." */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-blue-500/10 border-l-4 border-blue-500 p-2 px-3 rounded-t-xl mb-1 text-sm animate-fade-in">
          <div>
            <span className="text-blue-500 font-semibold text-xs uppercase tracking-wider">
              Editando Mensaje
            </span>
            <p className="text-white/70 truncate w-64 md:w-96">
              {editingMessage.content}
            </p>
          </div>
          <button onClick={onCancelEdit} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="relative flex items-center gap-2 w-full">

        {/* Popovers de Media (Emojis / Giphy) */}
        {showPopup && (
          <div ref={popupRef} className="absolute bottom-[110%] left-0 w-[320px] h-[400px] z-50 bg-[#0d111c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/5">
              <button
                onClick={() => setPopupTab('emoji')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${popupTab === 'emoji' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-white/40 hover:text-white/70'}`}
              >
                Emojis
              </button>
              <button
                onClick={() => setPopupTab('giphy')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${popupTab === 'giphy' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-white/40 hover:text-white/70'}`}
              >
                Stickers
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {popupTab === 'emoji' ? (
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={onEmojiClick}
                  emojiStyle={EmojiStyle.NATIVE}
                  width="100%"
                  height="100%"
                  style={{ backgroundColor: 'transparent', border: 'none' }}
                />
              ) : (
                <div className="h-full overflow-y-auto w-full p-2 scrollbar-hide">
                  <Grid width={300} columns={3} fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })} onGifClick={onGiphyClick} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Selectors (Smile & Clip) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPopup(!showPopup)}
            className={`w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${showPopup ? 'text-[#39FF14]' : 'text-[#94a3b8] hover:text-[#39FF14]'}`}
            aria-label="Abrir Emojis/Stickers"
          >
            <Smile size={22} />
          </button>
          <label onClick={() => onMediaInteraction && onMediaInteraction()} className="w-10 h-10 flex items-center justify-center text-[#94a3b8] hover:text-[#39FF14] transition-all hover:scale-110 active:scale-95 cursor-pointer relative" title="Adjuntar imagen">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0]
                if (f) {
                  setSelectedFile(f)
                  const u = URL.createObjectURL(f)
                  setPreviewUrl(u)
                }
                e.target.value = '' // reset
              }}
            />
            <Paperclip size={22} />
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTimerPopup(!showTimerPopup)}
              className={`w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${expiresIn > 0 ? 'text-[#39FF14]' : 'text-[#94a3b8] hover:text-[#39FF14]'}`}
              title="Mensajes Efímeros"
            >
              <Clock size={20} />
              {expiresIn > 0 && <span className="absolute bottom-1 right-1 w-2 h-2 bg-[#FF3131] rounded-full border border-[#0d111c]"></span>}
            </button>
            {showTimerPopup && (
              <div className="absolute bottom-[110%] left-0 w-32 bg-[#0d111c] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-fade-in-up">
                {timerOptions.map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => { setExpiresIn(opt.v); setShowTimerPopup(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${expiresIn === opt.v ? 'bg-[#39FF14]/20 text-[#39FF14] font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Input Field */}
        <div className="flex-1 relative bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner p-1 overflow-hidden">
          {isRecording ? (
            <div className="w-full h-11 flex items-center px-4 bg-red-500/10 text-red-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3"></span>
              Grabando audio... {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          ) : (
            <input
              className="w-full cyber-input text-sm h-11 px-4"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (onTyping) onTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Escribe un mensaje cifrado..."
            />
          )}

          {/* Image Preview Thumbnail */}
          {previewUrl && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 backdrop-blur-md animate-fade-in">
              <FeatherImage size={14} className="text-[#39FF14]" />
              <img src={previewUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
              <button
                onClick={() => {
                  setSelectedFile(null)
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }}
                className="text-[#FF3131] hover:scale-110 transition-transform bg-[#FF3131]/10 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Send / Mic Button */}
        {content.trim() || selectedFile ? (
          <button
            className="w-12 h-12 rounded-xl bg-[#39FF14] flex-shrink-0 flex items-center justify-center text-black shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:scale-105 active:scale-95 transition-all"
            onClick={handleSend}
            aria-label="Enviar"
          >
            <ArrowUp size={22} strokeWidth={3} />
          </button>
        ) : isRecording ? (
          <button
            className="w-12 h-12 rounded-xl bg-red-500 flex-shrink-0 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 transition-all"
            onClick={stopRecording}
            aria-label="Detener y Enviar"
          >
            <Square size={18} fill="currentColor" />
          </button>
        ) : (
          <button
            className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/20 hover:scale-105 active:scale-95 transition-all"
            onClick={startRecording}
            aria-label="Grabar Audio"
          >
            <Mic size={22} />
          </button>
        )}

        <style jsx global>{`
        /* Override emoji picker styles gently */
        .EmojiPickerReact {
          --epr-bg-color: transparent !important;
          --epr-category-label-bg-color: transparent !important;
          --epr-border-color: rgba(255,255,255,0.05) !important;
        }
      `}</style>
      </div>
    </div>
  )
}

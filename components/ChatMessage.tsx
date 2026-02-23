'use client'

import React, { useEffect, useState } from 'react'
import { CornerUpLeft, Edit2, Trash2 } from 'react-feather'

export default function ChatMessage({ message, isOwn, onReply, replyMessage, onEdit, onDelete }: { message: any; isOwn: boolean; onReply?: () => void; replyMessage?: any; onEdit?: () => void; onDelete?: () => void }) {
  const [enter, setEnter] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`flex flex-col group ${isOwn ? 'items-end' : 'items-start'} ${enter ? 'animate-slide-in' : 'opacity-0'} mb-2`}>
      <div className="flex items-center gap-2 relative">
        {/* Botones de acción (aparecen a la izquierda si escribo yo) */}
        {isOwn && !message.is_deleted && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mr-1 transition-all">
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 text-white/30 hover:text-red-500 transition-all bg-white/5 rounded-full" title="Eliminar">
                <Trash2 size={14} />
              </button>
            )}
            {onEdit && message.message_type === 'text' && (
              <button onClick={onEdit} className="p-1.5 text-white/30 hover:text-blue-400 transition-all bg-white/5 rounded-full" title="Editar">
                <Edit2 size={14} />
              </button>
            )}
            {onReply && (
              <button onClick={onReply} className="p-1.5 text-white/30 hover:text-[#39FF14] transition-all bg-white/5 rounded-full" title="Responder">
                <CornerUpLeft size={14} className="scale-x-[-1]" />
              </button>
            )}
          </div>
        )}

        {/* Burbuja Principal */}
        <div className={`max-w-[80vw] md:max-w-md ${isOwn ? 'bubble-sent' : 'bubble-recv'} glass-card shadow-lg`}>

          {message.is_deleted ? (
            <p className="text-white/40 italic text-sm m-0">🚫 Mensaje eliminado</p>
          ) : (
            <>
              {/* Si este mensaje es una respuesta a otro */}
              {replyMessage && (
                <div className={`mb-2 p-2 rounded flex flex-col border-l-2 text-xs bg-black/20 ${isOwn ? 'border-[#39FF14]' : 'border-white/20'}`}>
                  <span className={`font-semibold mb-1 ${isOwn ? 'text-[#39FF14]' : 'text-white/60'}`}>
                    {replyMessage.sender_id === message.sender_id ? 'A sí mismo' : 'Respondiendo'}
                  </span>
                  <span className="text-white/70 truncate opacity-80 line-clamp-2">
                    {replyMessage.message_type === 'image' ? '📸 Imagen'
                      : replyMessage.message_type === 'sticker' ? '✨ Sticker'
                        : replyMessage.message_type === 'audio' ? '🎤 Nota de Voz'
                          : replyMessage.content}
                  </span>
                </div>
              )}

              {/* Contenido del mensaje actual */}
              {message.message_type === 'text' && (
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap m-0">
                  {message.content}
                </p>
              )}
              {message.message_type === 'image' && message.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.image_url}
                  alt="img"
                  className="rounded-lg max-h-72 object-cover border border-white/5"
                />
              )}
              {message.message_type === 'sticker' && message.sticker_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.sticker_url}
                  alt="sticker"
                  className="rounded-lg bg-transparent w-40 h-auto"
                />
              )}
              {message.message_type === 'audio' && message.audio_url && (
                <audio controls className="max-w-[200px] h-10 outline-none rounded-lg bg-white/5 my-1">
                  <source src={message.audio_url} type="audio/webm" />
                </audio>
              )}
              <div className="flex items-center justify-end gap-2 mt-2 opacity-50">
                <span className="text-[10px] text-white/60 font-medium">
                  {message.is_edited && <span className="mr-1 italic">(editado)</span>}
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isOwn && (
                  <div className="flex -space-x-1">
                    <span className={`text-[10px] ${message.is_read ? 'text-[#39FF14]' : 'text-white/40'}`}>✓</span>
                    <span className={`text-[10px] ${message.is_read ? 'text-[#39FF14]' : 'text-white/40'}`}>✓</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Botón de responder para el recipiente */}
        {!isOwn && onReply && !message.is_deleted && (
          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-[#39FF14] transition-all bg-white/5 rounded-full ml-1"
            title="Responder"
          >
            <CornerUpLeft size={14} className="scale-x-[-1]" />
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'

export default function ChatMessage({ message, isOwn }: { message: any; isOwn: boolean }) {
  const [enter, setEnter] = useState(false)

  useEffect(() => {
    // trigger enter animation on mount
    const t = setTimeout(() => setEnter(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="msg-item" style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', width: '100%' }}>
      <div className={`bubble ${isOwn ? 'sent' : 'recv'} ${enter ? 'msg-enter' : ''}`}>
        {message.message_type === 'text' && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>}
        {message.message_type === 'image' && message.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.image_url} alt="img" style={{ borderRadius: 8, maxHeight: 288, objectFit: 'cover' }} />
        )}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{new Date(message.created_at).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

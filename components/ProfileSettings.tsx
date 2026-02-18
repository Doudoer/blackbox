"use client"

import React, { useState, useEffect } from 'react'
import createClient from '../lib/supabase'

export default function ProfileSettings({ onClose }: { onClose?: () => void }) {
  const supabase = createClient()
  // Trim env var in case it contains stray whitespace or CRLF from environment files
  const BUCKET = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'images').trim()
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [locked, setLocked] = useState(false)
  const [hasLock, setHasLock] = useState(false)
  const [lockKey, setLockKey] = useState('')
  const [lockKeyConfirm, setLockKeyConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // load current profile
    fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json()).then((j) => {
      const u = j.user
      if (u) {
        // Only expose bio as editable public name. Username is immutable and not editable.
        setBio(u.bio || '')
        setAvatarUrl(u.avatar_url || null)
        setLocked(!!u.pass_blocked)
        setHasLock(!!u.has_lock)
      }
    })
    // load lock flag
    // not exposed in public view, can be requested from server if needed; skip for now
  }, [])

  // close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const uploadAvatarAndSave = async () => {
    setLoading(true)
    try {
      let publicUrl = avatarUrl
      if (selectedFile) {
        // upload via server endpoint to avoid RLS/ownership issues on storage.objects
        const res = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile,
        })
        const j = await res.json()
        if (!res.ok || !j.ok) throw new Error(j.error || 'Upload failed')
        // sanitize returned URL (in case it's malformed or contains CR/LF sequences)
        publicUrl = (j.publicURL || '')
          .toString()
          .replace(/%0D%0A/gi, '')
          .replace(/\r|\n/g, '')
          .trim()
      }

      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        // Only send bio and avatar_url. Username must not be modifiable by clients.
        body: JSON.stringify({ bio, avatar_url: publicUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      // update local UI immediately (add cache-buster), notify app and close modal
      const shownUrl = publicUrl ? `${publicUrl}?cb=${Date.now()}` : publicUrl
      setAvatarUrl(shownUrl)
      // notify other parts of the app to refresh their copy of the user
      try {
        window.dispatchEvent(new CustomEvent('profile:updated'))
      } catch (e) {
        // ignore in non-browser contexts
      }
      if (onClose) onClose()
    } catch (err) {
      console.error(err)
      alert('Error al guardar perfil: ' + (err as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Password change failed')
      alert('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      alert('Error: ' + (err as any).message)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async (value: boolean) => {
    setLoading(true)
    try {
      if (value && !hasLock) {
        // Require setting a lock key first
        alert('Por favor establece una clave de bloqueo antes de activar el bloqueo de la app.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/profile/lock', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locked: value }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lock update failed')
      setLocked(value)
  try { window.dispatchEvent(new CustomEvent('profile:updated')) } catch (e) {}
    } catch (err) {
      alert('Error: ' + (err as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetLockKey = async () => {
    if (!lockKey || lockKey !== lockKeyConfirm) return alert('Las claves no coinciden o están vacías')
    setLoading(true)
    try {
      const res = await fetch('/api/profile/set-lock-key', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lock_key: lockKey }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to set lock key')
      setHasLock(true)
      setLockKey('')
      setLockKeyConfirm('')
      alert('Clave de bloqueo establecida')
  try { window.dispatchEvent(new CustomEvent('profile:updated')) } catch (e) {}
    } catch (err) {
      alert('Error: ' + (err as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Editar perfil</h3>
        <label>Nombre público (bio)</label>
        <input value={bio} onChange={(e) => setBio(e.target.value)} />

        <label>Avatar</label>
        {avatarUrl && <img src={avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }} />}
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) setSelectedFile(f) }} />

        <div style={{ marginTop: 12 }}>
          <button onClick={uploadAvatarAndSave} disabled={loading}>Guardar perfil</button>
          <button onClick={() => onClose && onClose()} style={{ marginLeft: 8 }}>Cerrar</button>
        </div>

        <hr style={{ margin: '12px 0' }} />

        <h4>Cambiar contraseña</h4>
        <input type="password" placeholder="Contraseña actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button onClick={handleChangePassword} disabled={loading}>Cambiar contraseña</button>
        </div>

        <hr style={{ margin: '12px 0' }} />

        <h4>Bloqueo de la app</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
            <label style={{ flex: 1 }}>Bloquear app</label>
            <input type="checkbox" checked={locked} onChange={(e) => toggleLock(e.target.checked)} />
          </div>

          <div style={{ width: '100%', marginTop: 8 }}>
            <label>Clave de bloqueo (PIN/contraseña)</label>
            <input type="password" placeholder="Clave de bloqueo" value={lockKey} onChange={(e) => setLockKey(e.target.value)} />
            <input type="password" placeholder="Confirmar clave" value={lockKeyConfirm} onChange={(e) => setLockKeyConfirm(e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <button onClick={handleSetLockKey} disabled={loading}>Guardar clave de bloqueo</button>
              {hasLock && <span style={{ marginLeft: 8 }}>Clave configurada</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

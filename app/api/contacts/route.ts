import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'
import { getAuthSecret } from '../../../lib/env'

function getUid(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/bb_token=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return null
  try {
    const secret = getAuthSecret()
    const payload = jwt.verify(token, secret) as any
    return payload.sub || null
  } catch {
    return null
  }
}

/* ─── GET /api/contacts ──────────────────────────────────────────────────────
   Returns the authenticated user's contact list (from the contacts table).   */
export async function GET(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  const supabase = createAdminClient()

  // Step 1: get ids of accepted contacts for this user
  const { data: rows, error: rowsError } = await supabase
    .from('contacts')
    .select('contact_id')
    .eq('user_id', uid)
    .eq('status', 'accepted')

  if (rowsError) {
    console.error('[contacts:GET] contacts query error:', rowsError)
    return NextResponse.json({ ok: false, error: rowsError.message }, { status: 500 })
  }

  const contactIds = (rows || []).map((r: any) => r.contact_id)
  if (contactIds.length === 0) return NextResponse.json({ ok: true, contacts: [] })

  // Step 2: fetch profiles for those ids
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, nombre_mostrar, avatar_url')
    .in('id', contactIds)

  if (profilesError) {
    console.error('[contacts:GET] profiles query error:', profilesError)
    return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 })
  }

  // Step 3: Count unread messages for each of those contacts
  const { data: unreadCounts, error: unreadError } = await supabase
    .from('messages')
    .select('sender_id', { count: 'exact' })
    .eq('receiver_id', uid)
    .eq('is_read', false)
    .in('sender_id', contactIds)

  let countsMap: Record<string, number> = {}

  if (!unreadError && unreadCounts) {
    // We have to group them ourselves in JS
    countsMap = unreadCounts.reduce((acc: any, curr: any) => {
      acc[curr.sender_id] = (acc[curr.sender_id] || 0) + 1
      return acc
    }, {})
  }

  // Attach unread counts to the profiles
  const result = (profiles || []).map(p => ({
    ...p,
    unread_msgs: countsMap[p.id] || 0
  }))

  return NextResponse.json({ ok: true, contacts: result })
}

/* ─── POST /api/contacts ─────────────────────────────────────────────────────
   Body: { contact_id: string }  — adds a contact by id or username.         */
export async function POST(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const supabase = createAdminClient()
  let contactId: string | null = body?.contact_id || null

  // If not a UUID, try to resolve by username
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (contactId && !uuidRegex.test(contactId)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', contactId)
      .single()
    contactId = profile?.id || null
  }

  if (!contactId) return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 })
  if (contactId === uid) return NextResponse.json({ ok: false, error: 'No puedes agregarte a ti mismo' }, { status: 400 })

  // Check if a request already exists in either direction
  const { data: existing } = await supabase
    .from('contacts')
    .select('*')
    .or(`user_id.eq.${uid},contact_id.eq.${uid}`)
    .or(`user_id.eq.${contactId},contact_id.eq.${contactId}`)
    .limit(1)

  if (existing && existing.length > 0) {
    const rel = existing[0]
    if (rel.status === 'accepted') return NextResponse.json({ ok: false, error: 'Ya tienes a este contacto' }, { status: 409 })
    if (rel.user_id === uid && rel.status === 'pending') return NextResponse.json({ ok: false, error: 'Ya enviaste una solicitud a este usuario' }, { status: 409 })
    if (rel.contact_id === uid && rel.status === 'pending') return NextResponse.json({ ok: false, error: 'Este usuario ya te envió una solicitud. Revisa tus notificaciones.' }, { status: 409 })
  }

  const { error } = await supabase
    .from('contacts')
    .insert({ user_id: uid, contact_id: contactId, status: 'pending' })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Ya hay una solicitud' }, { status: 409 })
    }
    console.error('[contacts:POST]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // We don't return the full profile anymore since they're not contacts yet
  return NextResponse.json({ ok: true, pending: true })
}

/* ─── DELETE /api/contacts?id=<contact_id> ───────────────────────────────────
   Removes a contact from the user's list.                                    */
export async function DELETE(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  const url = new URL(req.url)
  let contactId = url.searchParams.get('id')

  if (!contactId) {
    try { const body = await req.json(); contactId = body?.contact_id || body?.id || null } catch { }
  }

  if (!contactId) return NextResponse.json({ ok: false, error: 'Missing contact id' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .match({ user_id: uid, contact_id: contactId })

  if (error) {
    console.error('[contacts:DELETE]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/* ─── PATCH /api/contacts?q=<pin> ──────────────────────────────────────────
   Searches for a specific user by their exact 6-character PIN.
   Excludes: current user + already-added contacts.                          */
export async function PATCH(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim().toUpperCase()

  // Only proceed if it's exactly 6 characters long
  if (q.length !== 6) {
    return NextResponse.json({ ok: true, users: [] })
  }

  const supabase = createAdminClient()

  // Get current contact ids to exclude
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('contact_id')
    .eq('user_id', uid)

  const excludeIds: string[] = [uid, ...((existingContacts || []).map((r: any) => r.contact_id))]

  // Search exclusively by exact PIN, excluding known IDs
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, nombre_mostrar, avatar_url, pin')
    .eq('pin', q)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(1)

  if (error) {
    console.error('[contacts:PATCH/search]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, users: data || [] })
}

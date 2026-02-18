import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const peer = url.searchParams.get('peer')
    if (!peer) return NextResponse.json({ ok: false, error: 'Missing peer param' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    const uid = payload.sub
    const supabase = createAdminClient()

    // resolve peer if it's a public_id
    const { resolvePublicIdToUid, looksLikeUUID, makePublicId } = await import('../../../lib/privacy')
    let peerUid = peer
    if (!looksLikeUUID(peerUid!)) {
      const resolved = await resolvePublicIdToUid(peerUid!)
      if (!resolved) return NextResponse.json({ ok: false, error: 'Peer not found' }, { status: 404 })
      peerUid = resolved
    }

    // fetch messages where (sender=me AND receiver=peer) OR (sender=peer AND receiver=me)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${peerUid}),and(sender_id.eq.${peerUid},receiver_id.eq.${uid})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[messages:GET] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    // map message ids to public ids to avoid exposing uuids
    const mapped = (data || []).map((m: any) => ({
      ...m,
      sender_public_id: makePublicId(m.sender_id),
      receiver_public_id: makePublicId(m.receiver_id),
      // remove raw uids from payload
      sender_id: undefined,
      receiver_id: undefined,
    }))

    return NextResponse.json({ ok: true, messages: mapped })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { receiver_id, content, message_type, image_url, sticker_url } = body
    if (!receiver_id) return NextResponse.json({ ok: false, error: 'Missing receiver_id' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    const uid = payload.sub
    const supabase = createAdminClient()

    const insert = {
      sender_id: uid,
      receiver_id,
      content: content || null,
      image_url: message_type === 'image' ? image_url : null,
      sticker_url: message_type === 'sticker' ? sticker_url : null,
      message_type: message_type || 'text',
    }

    // receiver_id may be a public_id; resolve if needed
    const { resolvePublicIdToUid, looksLikeUUID, makePublicId } = await import('../../../lib/privacy')
    let finalReceiver = receiver_id
    if (!looksLikeUUID(finalReceiver)) {
      const resolved = await resolvePublicIdToUid(finalReceiver)
      if (!resolved) return NextResponse.json({ ok: false, error: 'Recipient not found' }, { status: 404 })
      finalReceiver = resolved
    }
    insert.receiver_id = finalReceiver

    const { data, error } = await supabase.from('messages').insert(insert).select().single()
    if (error) {
      console.error('[messages:POST] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    // return a privacy-safe message object
    const msg = data
    const safe = {
      ...msg,
      sender_public_id: makePublicId(msg.sender_id),
      receiver_public_id: makePublicId(msg.receiver_id),
    }
    // strip raw ids
    delete (safe as any).sender_id
    delete (safe as any).receiver_id

    return NextResponse.json({ ok: true, message: safe })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

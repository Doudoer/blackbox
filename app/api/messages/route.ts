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

    // fetch messages where (sender=me AND receiver=peer) OR (sender=peer AND receiver=me)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${peer}),and(sender_id.eq.${peer},receiver_id.eq.${uid})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[messages:GET] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, messages: data || [] })
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

    const { data, error } = await supabase.from('messages').insert(insert).select().single()
    if (error) {
      console.error('[messages:POST] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

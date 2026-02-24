import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'
import { getAuthSecret } from '../../../lib/env'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const peer = url.searchParams.get('peer')
    if (!peer) return NextResponse.json({ ok: false, error: 'Missing peer param' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = getAuthSecret()
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
    const { receiver_id, content, message_type, image_url, sticker_url, reply_to_id, audio_url, expires_at } = body
    if (!receiver_id) return NextResponse.json({ ok: false, error: 'Missing receiver_id' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = getAuthSecret()
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
      audio_url: message_type === 'audio' ? audio_url : null,
      message_type: message_type || 'text',
      reply_to_id: reply_to_id || null,
      expires_at: expires_at || null,
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

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, content } = body
    if (!id || !content) return NextResponse.json({ ok: false, error: 'Missing id or content' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = getAuthSecret()
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    const uid = payload.sub
    const supabase = createAdminClient()

    // Solo el dueño puede editar su mensaje
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true })
      .eq('id', id)
      .eq('sender_id', uid)
      .select()
      .single()

    if (error) {
      console.error('[messages:PUT] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const peer_id = url.searchParams.get('peer_id')

    if (!id && !peer_id) return NextResponse.json({ ok: false, error: 'Missing id or peer_id param' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = getAuthSecret()
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    const uid = payload.sub
    if (!uid) return NextResponse.json({ ok: false, error: 'Invalid token payload' }, { status: 400 })

    const supabase = createAdminClient()

    if (peer_id) {
      // Borrar toda la conversación con este peer (envíos mutuos)
      // Usamos el mismo patrón de "borrado suave" pero masivo
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, content: '', image_url: null, sticker_url: null, audio_url: null })
        .or(`and(sender_id.eq.${uid},receiver_id.eq.${peer_id}),and(sender_id.eq.${peer_id},receiver_id.eq.${uid})`)

      if (error) {
        console.error('[messages:DELETE:bulk] supabase error:', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (id && id.startsWith('tmp-')) return NextResponse.json({ ok: true, message: 'tmp ignored' })

    // Borrado individual
    const { data, error } = await supabase
      .from('messages')
      .update({ is_deleted: true, content: '', image_url: null, sticker_url: null, audio_url: null })
      .eq('id', id!)
      .eq('sender_id', uid)
      .select()
      .single()

    if (error) {
      console.error('[messages:DELETE] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const peer_id = url.searchParams.get('peer_id')
    if (!peer_id) return NextResponse.json({ ok: false, error: 'Missing peer_id' }, { status: 400 })

    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const secret = getAuthSecret()
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    const uid = payload.sub
    const supabase = createAdminClient()

    // Marcar como leídos los mensajes que yo recibí de este peer
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', peer_id)
      .eq('receiver_id', uid)
      .eq('is_read', false)

    if (error) {
      console.error('[messages:PATCH] error marking as read:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

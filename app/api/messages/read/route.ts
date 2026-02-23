import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

function getUid(req: Request): string | null {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    if (!token) return null
    try {
        const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
        const payload = jwt.verify(token, secret) as any
        return payload.sub || null
    } catch {
        return null
    }
}

/* ─── POST /api/messages/read ─────────────────────────────────────────────
   Marks all messages sent BY `peer_id` TO the current user as read.       */
export async function POST(req: Request) {
    const uid = getUid(req)
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    let body: any
    try { body = await req.json() } catch { body = {} }
    const peerId = body?.peer_id

    if (!peerId) return NextResponse.json({ ok: false, error: 'Missing peer_id' }, { status: 400 })

    const supabase = createAdminClient()

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .match({ receiver_id: uid, sender_id: peerId, is_read: false })

    if (error) {
        console.error('[messages:read]', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

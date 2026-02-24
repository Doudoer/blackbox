import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'
import { getAuthSecret } from '../../../../lib/env'

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

/* ─── GET /api/contacts/requests ──────────────────────────────────────────────
   Returns the pending contact requests FOR the authenticated user.          */
export async function GET(req: Request) {
    const uid = getUid(req)
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const supabase = createAdminClient()

    // Find users who sent a request to `uid` where status is 'pending'
    const { data: rows, error: rowsError } = await supabase
        .from('contacts')
        .select('user_id')
        .eq('contact_id', uid)
        .eq('status', 'pending')

    if (rowsError) {
        console.error('[requests:GET]', rowsError)
        return NextResponse.json({ ok: false, error: rowsError.message }, { status: 500 })
    }

    const requesterIds = (rows || []).map((r: any) => r.user_id)
    if (requesterIds.length === 0) return NextResponse.json({ ok: true, requests: [] })

    // Fetch profiles of the requesters
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, nombre_mostrar, avatar_url')
        .in('id', requesterIds)

    if (profilesError) {
        return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, requests: profiles || [] })
}

/* ─── POST /api/contacts/requests ─────────────────────────────────────────────
   Accepts a request from a specific user.
   Body: { requester_id: string }                                            */
export async function POST(req: Request) {
    const uid = getUid(req)
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    let body: any
    try { body = await req.json() } catch { body = {} }
    const requesterId = body?.requester_id

    if (!requesterId) return NextResponse.json({ ok: false, error: 'Missing requester_id' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Update the original request to 'accepted'
    const { error: updateError } = await supabase
        .from('contacts')
        .update({ status: 'accepted' })
        .match({ user_id: requesterId, contact_id: uid, status: 'pending' })

    if (updateError) {
        console.error('[requests:POST accept update]', updateError)
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    // 2. Insert the reverse relationship as 'accepted' so it's a mutual contact
    const { error: insertError } = await supabase
        .from('contacts')
        .insert({ user_id: uid, contact_id: requesterId, status: 'accepted' })
        // Use upsert to avoid error if they somehow already had it
        .select()

    if (insertError && insertError.code !== '23505') { // ignore duplicate key
        console.error('[requests:POST accept insert]', insertError)
    }

    // Return the new contact data
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, nombre_mostrar, avatar_url')
        .eq('id', requesterId)
        .single()

    return NextResponse.json({ ok: true, contact: profile })
}

/* ─── DELETE /api/contacts/requests?id=<requester_id> ─────────────────────
   Rejects a request by deleting it.                                         */
export async function DELETE(req: Request) {
    const uid = getUid(req)
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const requesterId = url.searchParams.get('id')
    if (!requesterId) return NextResponse.json({ ok: false, error: 'Missing user id' }, { status: 400 })

    const supabase = createAdminClient()

    // Delete the pending request
    const { error } = await supabase
        .from('contacts')
        .delete()
        .match({ user_id: requesterId, contact_id: uid, status: 'pending' })

    if (error) {
        console.error('[requests:DELETE reject]', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

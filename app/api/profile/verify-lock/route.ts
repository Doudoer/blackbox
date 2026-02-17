import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lock_key } = body
    if (typeof lock_key !== 'string' || lock_key.length === 0) return NextResponse.json({ ok: false, error: 'Missing lock_key' }, { status: 400 })

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

    const { data, error } = await supabase.rpc('verify_user_lock', { p_user_id: uid, p_lock: lock_key })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    // RPC returns boolean
    const ok = !!data
    return NextResponse.json({ ok })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

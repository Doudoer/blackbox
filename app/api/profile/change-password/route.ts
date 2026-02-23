import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { current_password, new_password } = body
    if (!current_password || !new_password) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

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

  // retrieve username for this uid
  const { data: profileRow, error: profErr } = await supabase.from('profiles').select('username').eq('id', uid).single()
  if (profErr || !profileRow) return NextResponse.json({ ok: false, error: 'Could not load profile' }, { status: 500 })
  const username = (profileRow as any).username

  // Verify current password via RPC (returns uuid or null)
  const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_user_password', { p_username: username, p_password: current_password })
    if (verifyError) return NextResponse.json({ ok: false, error: verifyError.message }, { status: 500 })
    if (!verifyResult || verifyResult !== uid) return NextResponse.json({ ok: false, error: 'Current password incorrect' }, { status: 403 })

    // Call set_user_password RPC
    const { error: setErr } = await supabase.rpc('set_user_password', { p_user_id: uid, p_password: new_password })
    if (setErr) return NextResponse.json({ ok: false, error: setErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

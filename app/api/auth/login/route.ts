import { NextResponse } from 'next/server'
import createAdminClient from '../../../../lib/supabase-admin'
import jwt from 'jsonwebtoken'
import { getAuthSecret } from '../../../../lib/env'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body
    if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const supabase = createAdminClient()

    // Call the Postgres function verify_user_password
    const { data, error } = await supabase.rpc('verify_user_password', { p_username: username, p_password: password })
    if (error) return NextResponse.json({ error: 'Auth error' }, { status: 500 })

    const uid = (data as any) ?? null
    if (!uid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    // Check if pass_blocked for user
    const { data: profileData } = await supabase.from('profiles').select('pass_blocked').eq('id', uid).single()
    if (profileData?.pass_blocked) return NextResponse.json({ error: 'Account blocked' }, { status: 403 })

    // Sign JWT
    const secret = getAuthSecret()
  const token = jwt.sign({ sub: uid }, secret, { expiresIn: '7d' })

  console.log('[auth/login] signing token for uid=', uid)
  const res = NextResponse.json({ ok: true })
  // Set HttpOnly cookie
  const cookie = `bb_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  res.headers.set('Set-Cookie', cookie)
  console.log('[auth/login] set-cookie header length=', cookie.length)
  return res
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

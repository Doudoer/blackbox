import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null

    if (!token) return NextResponse.json({ user: null })

    const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
    } catch (err) {
      console.error('[auth/me] jwt verify failed:', (err as any).message)
      return NextResponse.json({ user: null })
    }

    const uid = payload.sub
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, nombre_mostrar, pass_blocked, pin, lock_key_hash, is_admin')
      .eq('id', uid)
      .single()

    if (error) {
      console.error('[auth/me] db error:', error.message)
      return NextResponse.json({ user: null, error: error.message }, { status: 500 })
    }

    if (!data) return NextResponse.json({ user: null })

    const publicUser = {
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      nombre_mostrar: data.nombre_mostrar,
      pass_blocked: data.pass_blocked,
      pin: data.pin,
      lock_key_hash: data.lock_key_hash,
      is_admin: data.is_admin,
    }

    return NextResponse.json({ user: publicUser })
  } catch (err: any) {
    console.error('[auth/me] fatal error:', err.message)
    return NextResponse.json({ user: null, error: err.message }, { status: 500 })
  }
}

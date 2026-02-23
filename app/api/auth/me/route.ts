import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/bb_token=([^;]+)/)
    const token = match ? match[1] : null
    console.log('[auth/me] cookie header length=', cookieHeader.length)
    console.log('[auth/me] cookie header sample=', cookieHeader.slice(0, 200))
    console.log('[auth/me] token present?', !!token, token ? `len=${token.length} head=${token.slice(0, 10)}...` : '')
    if (!token) {
      console.log('[auth/me] returning user:null because token missing')
      return NextResponse.json({ user: null })
    }

    const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
    let payload: any
    try {
      payload = jwt.verify(token, secret) as any
      console.log('[auth/me] token verified for sub=', payload?.sub)
    } catch (err) {
      console.log('[auth/me] token verify failed', (err as any).message)
      console.log('[auth/me] token (head) =', token.slice(0, 40))
      return NextResponse.json({ user: null })
    }

    const uid = payload.sub
    const supabase = createAdminClient()
    // select safe fields from profiles including the app lock flag
    try {
      const { data, error } = await supabase
        .from('profiles')
        // select pass_blocked, pin and lock_key_hash
        .select('id, username, avatar_url, nombre_mostrar, pass_blocked, pin, lock_key_hash')
        .eq('id', uid)
        .single()
      console.log('[auth/me] profiles query uid=', uid, 'data=', !!data, 'error=', error ? error.message : null)
      if (error) {
        console.log('[auth/me] profiles query error details=', JSON.stringify(error))
      }
      if (!data) {
        console.log('[auth/me] returning user:null because profile not found')
        return NextResponse.json({ user: null })
      }

      const publicUser = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        nombre_mostrar: data.nombre_mostrar,
        pass_blocked: data.pass_blocked,
        pin: data.pin,
        lock_key_hash: data.lock_key_hash,
      }
      console.log('[auth/me] returning user with id=', publicUser.id)
      return NextResponse.json({ user: publicUser })
    } catch (dbErr) {
      console.log('[auth/me] profiles query threw exception', (dbErr as any).message)
      return NextResponse.json({ user: null })
    }
  } catch (err) {
    return NextResponse.json({ user: null })
  }
}

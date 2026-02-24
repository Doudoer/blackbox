import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'
import { getAuthSecret } from '../../../../lib/env'

// Debug endpoint: return the current authenticated user's avatar_url as stored in profiles
export async function GET(req: Request) {
  try {
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

    const { data, error } = await supabase.from('profiles').select('id, avatar_url').eq('id', uid).single()
    if (error) {
      console.error('[profile/avatar] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, avatar_url: data?.avatar_url ?? null })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

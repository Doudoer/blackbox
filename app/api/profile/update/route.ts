import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { username, avatar_url, nombre_mostrar } = body

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

    const updates: any = {}
    if (typeof username === 'string') updates.username = username
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url
    if (typeof nombre_mostrar === 'string') updates.nombre_mostrar = nombre_mostrar

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 })

    // log update payload for debugging
    console.log('[profile/update] uid=', uid, 'updates=', updates)

    const { data, error } = await supabase.from('profiles').update(updates).eq('id', uid).select('id, avatar_url')
    if (error) {
      // log full error for debugging RLS / permission issues
      console.error('[profile/update] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    console.log('[profile/update] updated rows=', data)

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

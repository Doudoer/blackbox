import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { locked } = body
    if (typeof locked !== 'boolean') return NextResponse.json({ ok: false, error: 'Missing locked boolean' }, { status: 400 })

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

    const { error } = await supabase.from('profiles').update({ pass_blocked: locked }).eq('id', uid)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
  // In this deployment we use a global default unlock key (server-side) and do NOT store per-user lock keys.
  // Accept the request for compatibility, but do not persist the key.
  const { lock_key } = body
  if (typeof lock_key !== 'string' || lock_key.length === 0) return NextResponse.json({ ok: false, error: 'Missing lock_key' }, { status: 400 })

    // Historically this endpoint stored a per-user lock key and required auth.
    // Under the global-default unlock-key design we accept the request for
    // backwards compatibility but do not persist anything. To avoid raising
    // authentication errors on the client we do not require a cookie here.
    // (The actual unlock verification uses the global DEFAULT_UNLOCK_KEY.)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Log the error to help debug intermittent 500s during development.
    try {
      console.error('[api/profile/set-lock-key] error:', err && err.stack ? err.stack : err)
    } catch (e) {
      // ignore logging errors
    }
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

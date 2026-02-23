import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Clear cookie
  res.headers.set('Set-Cookie', 'bb_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax')
  return res
}

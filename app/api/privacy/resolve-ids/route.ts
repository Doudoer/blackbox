import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const uids: string[] = Array.isArray(body?.uids) ? body.uids : []
    if (!uids.length) return NextResponse.json({ ok: false, error: 'Missing uids' }, { status: 400 })

    const { makePublicId } = await import('../../../../lib/privacy')

    const map: Record<string, string> = {}
    for (const uid of uids) {
      try {
        map[uid] = makePublicId(uid)
      } catch (e) {
        map[uid] = ''
      }
    }

    return NextResponse.json({ ok: true, map })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export const runtime = 'edge'

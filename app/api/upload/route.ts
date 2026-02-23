import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    // authenticate via bb_token cookie (same approach as other profile endpoints)
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

    // Read raw bytes from the request. The client will POST the file body directly with Content-Type set.
    const contentType = (req.headers.get('content-type') || 'application/octet-stream').split(';')[0]
    const arrayBuffer = await req.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'avatar'

    const supabase = createAdminClient()
    const bucket = type === 'chat'
      ? 'chat_media'
      : (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blackboxbucket')

    let ext = ''
    const matchImage = contentType.match(/image\/(png|jpeg|jpg|gif|webp)/)
    const matchAudio = contentType.match(/audio\/(webm|mp3|mpeg|ogg|wav|mp4|x-m4a)/)

    if (matchImage) {
      ext = '.' + (matchImage[1] === 'jpeg' ? 'jpg' : matchImage[1])
    } else if (matchAudio) {
      ext = '.' + (matchAudio[1] === 'mpeg' ? 'mp3' : matchAudio[1].replace('x-', ''))
    }

    // Si es chat, la carpeta es messages/uid. Si es avatar, avatars/uid.
    const folder = type === 'chat' ? 'messages' : 'avatars'
    const path = `${folder}/${uid}/${Date.now()}${ext}`

    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: false,
    })

    if (error) {
      console.error('[api/upload] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    const publicData = supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = publicData?.data?.publicUrl
    // log for debugging: what we uploaded and the generated public url
    console.log('[api/upload] uploaded path=', data?.path || path, 'publicUrl=', publicUrl)

    return NextResponse.json({ ok: true, key: data?.path || path, publicURL: publicUrl })
  } catch (err: any) {
    console.error('[api/upload] unexpected error:', err)
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'
import { getAuthSecret } from '../../../../lib/env'

export async function POST(req: Request) {
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
        if (!uid) return NextResponse.json({ ok: false, error: 'Invalid token payload' }, { status: 400 })

        const supabase = createAdminClient()

        // 1. Borrar todos los mensajes donde el usuario es remitente o destinatario (soft-delete masivo)
        const { error: msgError } = await supabase
            .from('messages')
            .update({ is_deleted: true, content: 'AUTODESTRUCTED', image_url: null, sticker_url: null, audio_url: null })
            .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)

        if (msgError) {
            console.error('[profile/nuke] error deleting messages:', msgError)
        }

        // 2. Bloquear perfil definitivamente
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                pass_blocked: true,
                nombre_mostrar: 'BLOQUEADO DEFINITIVO',
                avatar_url: null
            })
            .eq('id', uid)

        if (profileError) {
            console.error('[profile/nuke] error blocking profile:', profileError)
            return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true, message: 'Autodestrucción completada' })
    } catch (err: any) {
        console.error('[profile/nuke] fatal error:', err)
        return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
    }
}

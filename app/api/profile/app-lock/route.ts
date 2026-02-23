import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
    try {
        const cookieHeader = req.headers.get('cookie') || ''
        const match = cookieHeader.match(/bb_token=([^;]+)/)
        const token = match ? match[1] : null
        if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret'
        let payload: any
        try {
            payload = jwt.verify(token, secret) as any
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { lock_key_hash } = await req.json()
        const uid = payload.sub
        if (!uid) return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })

        const supabase = createAdminClient()

        // Actualiza el lock_key_hash. Si lock_key_hash es null/vacío, se removerá el bloqueo
        const { error } = await supabase
            .from('profiles')
            .update({ lock_key_hash: lock_key_hash || null })
            .eq('id', uid)

        if (error) {
            console.error('[app-lock] error updating lock_key_hash:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('[app-lock] generic error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

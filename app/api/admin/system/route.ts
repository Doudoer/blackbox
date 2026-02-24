import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action } = body

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

        const adminUid = payload.sub
        const supabase = createAdminClient()

        // 1. Verify admin privilege
        const { data: adminData } = await supabase.from('profiles').select('is_admin').eq('id', adminUid).single()
        if (!adminData?.is_admin) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

        if (action === 'clear_messages') {
            const { error } = await supabase.from('messages').delete().neq('id', -1) // Delete all
            if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
            return NextResponse.json({ ok: true, message: 'Mensajes eliminados correctamente' })
        }

        if (action === 'clear_storage') {
            const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blackboxbucket'

            // List all files in the bucket
            const { data: files, error: listError } = await supabase.storage.from(bucketName).list()
            if (listError) return NextResponse.json({ ok: false, error: listError.message }, { status: 500 })

            if (files && files.length > 0) {
                const fileNames = files.map(f => f.name)
                const { error: deleteError } = await supabase.storage.from(bucketName).remove(fileNames)
                if (deleteError) return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 })
            }

            return NextResponse.json({ ok: true, message: 'Archivos de almacenamiento eliminados' })
        }

        return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 })
    } catch (err: any) {
        console.error('[api/admin/system:POST] error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

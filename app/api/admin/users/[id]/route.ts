import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../../../lib/supabase-admin'

// PATCH /api/admin/users/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { action, value } = body

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

        const updates: any = {}

        if (action === 'toggle_lock') {
            updates.pass_blocked = value
        } else if (action === 'toggle_admin') {
            updates.is_admin = value
        } else if (action === 'reset_password') {
            // We use the helper function set_user_password in SQL if possible, 
            // but here we can just update the password_hash directly via the admin client
            // if we have a hash generator. For now, let's use the RPC if it exists or 
            // assume we can update password_hash.
            // The best way is to use the RPC defined in schema.sql: set_user_password
            const { error: rpcError } = await supabase.rpc('set_user_password', {
                p_user_id: id,
                p_password: value
            })
            if (rpcError) return NextResponse.json({ ok: false, error: rpcError.message }, { status: 500 })
            return NextResponse.json({ ok: true })
        } else if (action === 'reset_pin') {
            // In schema.sql we have 'pin' column and 'lock_key_hash'
            // The user mentioned "Modificar PIN de usuarios" and "cambiar claves de bloqueo"
            // Let's update both if action matches.
            updates.pin = value
            // If we want to reset the lock key too:
            const { error: rpcError } = await supabase.rpc('set_user_lock', {
                p_user_id: id,
                p_lock: value
            })
            if (rpcError) console.error('Error setting user lock via RPC:', rpcError)
        }

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('profiles').update(updates).eq('id', id)
            if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('[api/admin/users/id:PATCH] error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

// DELETE /api/admin/users/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

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

        // 2. Delete profile
        // Note: Due to foreign keys, this might delete related messages if CASCADE is set, 
        // or fail if RESTRICT. Usually we want to delete messages too or null them.
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('[api/admin/users/id:DELETE] error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

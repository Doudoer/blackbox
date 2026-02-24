import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import createAdminClient from '../../../../lib/supabase-admin'
import { getAuthSecret } from '../../../../lib/env'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
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
        const supabase = createAdminClient()

        // 1. Verify that the requester is an admin
        const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', uid)
            .single()

        if (adminError || !adminData?.is_admin) {
            return NextResponse.json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        // 2. Fetch all users (without created_at which is missing in schema)
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, nombre_mostrar, is_admin, pass_blocked')
            .order('username', { ascending: true })

        if (usersError) {
            console.error('[api/admin/users:GET] error:', usersError.message)
            return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true, users })
    } catch (err: any) {
        console.error('[api/admin/users:GET] fatal error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

// POST for creating a new user
export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()
        if (!username || !password) return NextResponse.json({ ok: false, error: 'Missing username or password' }, { status: 400 })

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

        const adminUid = payload.sub
        const supabase = createAdminClient()

        // 1. Verify admin privilege
        const { data: adminData } = await supabase.from('profiles').select('is_admin').eq('id', adminUid).single()
        if (!adminData?.is_admin) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

        // 2. Create profile
        const newUid = crypto.randomUUID()
        const { data: newUser, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: newUid,
                username,
                nombre_mostrar: username
            })
            .select()
            .single()

        if (createError) return NextResponse.json({ ok: false, error: createError.message }, { status: 500 })

        // 3. Set password using RPC helper
        const { error: rpcError } = await supabase.rpc('set_user_password', {
            p_user_id: newUid,
            p_password: password
        })

        if (rpcError) {
            console.error('Error setting password:', rpcError)
            return NextResponse.json({ ok: false, error: 'Profile created but password set failed' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, user: newUser })
    } catch (err: any) {
        console.error('[api/admin/users:POST] fatal error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}

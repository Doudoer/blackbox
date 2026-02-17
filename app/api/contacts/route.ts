import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'

export async function GET(req: Request) {
  try {
    // simple contacts list (all users except current)
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

    const { data, error } = await supabase.from('profiles').select('id, username, avatar_url').neq('id', uid)
    if (error) {
      console.error('[contacts] supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, contacts: data || [] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
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

    // accept contact id from query string (?id=...) or body
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    let contactId = id
    if (!contactId) {
      // try to read JSON body
      try {
        const body = await req.json()
        contactId = body?.contact_id || body?.id || null
      } catch (e) {
        // ignore
      }
    }

    if (!contactId) return NextResponse.json({ ok: false, error: 'Missing contact id' }, { status: 400 })

    // attempt to delete an explicit contacts entry (if the table exists)
    try {
      const { data, error } = await supabase.from('contacts').delete().match({ user_id: uid, contact_id: contactId })
      if (error) {
        console.error('[contacts:delete] supabase error:', error)

        // If the error indicates the contacts table doesn't exist, return a helpful SQL snippet
        const msg = (error?.message || '').toString()
        const missingTable = /Could not find the table|'contacts' does not exist|relation "contacts" does not exist/i.test(msg)
        const createSql = `CREATE TABLE IF NOT EXISTS public.contacts (\n  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,\n  contact_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  PRIMARY KEY (user_id, contact_id)\n);\nCREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts (contact_id);`;

        if (missingTable) {
          return NextResponse.json({ ok: false, error: 'contacts table not found', create_table_sql: createSql }, { status: 400 })
        }

        return NextResponse.json({ ok: false, error: error.message || String(error), details: error }, { status: 500 })
      }

      return NextResponse.json({ ok: true, deleted: data || [] })
    } catch (err: any) {
      console.error('[contacts:delete] unexpected error', err)
      return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

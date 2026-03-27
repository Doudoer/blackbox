import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import createAdminClient from '../../../lib/supabase-admin'
import { getAuthSecret } from '../../../lib/env'

export const dynamic = 'force-dynamic'

export interface ContextEntry {
  statement: string
  proof?: string
  date?: string
}

export interface UserContext {
  demographic: ContextEntry[]
  interests: ContextEntry[]
  relationships: ContextEntry[]
  events: ContextEntry[]
  instructions: ContextEntry[]
}

const EMPTY_CONTEXT: UserContext = {
  demographic: [],
  interests: [],
  relationships: [],
  events: [],
  instructions: [],
}

function getUid(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/bb_token=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return null
  try {
    const secret = getAuthSecret()
    const payload = jwt.verify(token, secret) as any
    return payload.sub || null
  } catch {
    return null
  }
}

function formatContextAsText(context: UserContext): string {
  const sections: string[] = []

  const renderEntries = (entries: ContextEntry[]): string => {
    if (!entries || entries.length === 0) return '  (sin entradas)'
    return entries
      .map((e) => {
        let line = `  ${e.statement}`
        if (e.proof || e.date) {
          const parts: string[] = []
          if (e.proof) parts.push(`El usuario dijo "${e.proof}"`)
          if (e.date) parts.push(`Fecha: ${e.date}`)
          line += `\n  - Prueba: ${parts.join('. ')}.`
        }
        return line
      })
      .join('\n\n')
  }

  sections.push(
    `1. Información demográfica\n${renderEntries(context.demographic)}`
  )
  sections.push(
    `2. Intereses y preferencias\n${renderEntries(context.interests)}`
  )
  sections.push(
    `3. Relaciones\n${renderEntries(context.relationships)}`
  )
  sections.push(
    `4. Eventos, proyectos y planes con fecha\n${renderEntries(context.events)}`
  )
  sections.push(
    `5. Instrucciones\n${renderEntries(context.instructions)}`
  )

  return sections.join('\n\n---\n\n')
}

/* ─── GET /api/context ────────────────────────────────────────────────────────
   Returns the user's stored context as structured JSON and as a formatted
   text block ready to paste into another AI assistant.                       */
export async function GET(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_context')
    .eq('id', uid)
    .single()

  if (error) {
    console.error('[context:GET] db error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const context: UserContext = data?.user_context ?? EMPTY_CONTEXT
  const formatted = formatContextAsText(context)

  return NextResponse.json({ ok: true, context, formatted })
}

/* ─── POST /api/context ───────────────────────────────────────────────────────
   Body: UserContext — saves the user's context data.                         */
export async function POST(req: Request) {
  const uid = getUid(req)
  if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const context: UserContext = {
    demographic: Array.isArray(body?.demographic) ? body.demographic : [],
    interests: Array.isArray(body?.interests) ? body.interests : [],
    relationships: Array.isArray(body?.relationships) ? body.relationships : [],
    events: Array.isArray(body?.events) ? body.events : [],
    instructions: Array.isArray(body?.instructions) ? body.instructions : [],
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ user_context: context })
    .eq('id', uid)

  if (error) {
    console.error('[context:POST] db error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const formatted = formatContextAsText(context)
  return NextResponse.json({ ok: true, context, formatted })
}

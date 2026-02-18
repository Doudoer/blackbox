import crypto from 'crypto'
import createAdminClient from './supabase-admin'

const HMAC_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.AUTH_SECRET || 'dev-secret').toString()

export function makePublicId(uid: string) {
  // deterministic HMAC -> hex -> take first 16 chars to produce a short public id
  const h = crypto.createHmac('sha256', HMAC_KEY).update(uid).digest('hex')
  return h.slice(0, 16)
}

export function looksLikeUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export async function resolvePublicIdToUid(publicId: string) {
  const supabase = createAdminClient()
  // fetch only ids to minimize data transferred
  const { data, error } = await supabase.from('profiles').select('id')
  if (error || !data) return null
  for (const row of data) {
    try {
      if (makePublicId(row.id) === publicId) return row.id
    } catch (e) {
      // ignore
    }
  }
  return null
}

export default { makePublicId, looksLikeUUID, resolvePublicIdToUid }

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceKey } from './env'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Note: in production you should throw or fail fast; for blueprint we allow undefined during dev
}

export function createAdminClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceKey()
  return createClient(url, key)
}

export default createAdminClient

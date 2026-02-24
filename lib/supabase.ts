import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseKey } from './env'

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()
  return createBrowserClient(url, key)
}

export default createClient

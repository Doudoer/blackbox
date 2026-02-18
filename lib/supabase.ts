import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Trim and sanitize environment values to avoid build/runtime errors when
  // values contain stray whitespace or CR/LF characters from env files.
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').toString().trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').toString().trim()
  // Ensure the URL has a protocol; some envs may accidentally omit it.
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : url ? `https://${url}` : url
  return createBrowserClient(normalizedUrl, key)
}

export default createClient

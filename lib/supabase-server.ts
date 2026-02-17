import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  // cookies() returns a ReadonlyRequestCookies in Next server components
  const cookieStore: any = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get?.(name)?.value
        },
        set(name: string, value: string, options: any) {
          // next/headers cookieStore.set expects an object in newer versions
          if (cookieStore.set) cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          if (cookieStore.set) cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export default createServerSupabaseClient

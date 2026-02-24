export function getEnv(name: string, defaultValue: string = ''): string {
    const value = process.env[name] || defaultValue
    return value.trim()
}

export function getAuthSecret(): string {
    return (process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret').trim()
}

export function getSupabaseUrl(): string {
    return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
}

export function getSupabaseKey(): string {
    return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
}

export function getSupabaseServiceKey(): string {
    return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
}

export function getStorageBucket(): string {
    return (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blackboxbucket').trim()
}

// scripts/check_env.js
// Simple prebuild check to ensure required environment variables exist.
// Prints which variables are missing and exits with code 1 if any are missing.

// Try to load .env.local (useful for local development). Do not overwrite existing env vars.
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
} catch (e) {
  // dotenv may not be installed in some CI environments; ignore if missing.
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET',
  'AUTH_SECRET',
  // SUPABASE_SERVICE_ROLE_KEY is required for server-side operations (uploads, RPCs)
  'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = required.filter((k) => !process.env[k])

if (missing.length === 0) {
  console.log('ENV CHECK OK: all required variables are defined')
  process.exit(0)
}

console.error('\nENV CHECK FAILED: the following required environment variables are missing:')
missing.forEach((m) => console.error(' - ' + m))
console.error('\nPlease add them to your environment or Vercel project settings before deploying.')

// exit with non-zero so the build fails early on Vercel with a clear message
process.exit(1)

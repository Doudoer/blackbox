/*
  Script: create_test_users.js
  - Inserts two chat users and one admin into `profiles` and sets their passwords
  - Requires environment variables in process.env or a .env.local file:
    NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  - Usage: node scripts/create_test_users.js
*/

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

function getEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env var ${name}. Create a .env.local or export it before running.`)
    process.exit(1)
  }
  return v
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const users = [
    { username: 'alice', password: 'Test1234!' },
    { username: 'bob', password: 'Test1234!' },
    { username: 'admin', password: 'Admin1234!', is_admin: true },
  ]

  for (const u of users) {
    const id = crypto.randomUUID()
    // insert profile
    const { data: insertData, error: insertErr } = await admin.from('profiles').insert([
      {
        id,
        username: u.username,
        bio: u.bio || null,
        avatar_url: u.avatar_url || null,
        is_admin: u.is_admin || false,
      },
    ])

    if (insertErr) {
      console.error('Failed to insert profile for', u.username, insertErr)
      continue
    }

    // set password via RPC function set_user_password
    const { data: rpcData, error: rpcErr } = await admin.rpc('set_user_password', { p_user_id: id, p_password: u.password })
    if (rpcErr) {
      console.error('Failed to set password for', u.username, rpcErr)
      continue
    }

    console.log(`Created user: ${u.username} id=${id} password=${u.password} is_admin=${!!u.is_admin}`)
  }

  console.log('Done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

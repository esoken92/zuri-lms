#!/usr/bin/env node
/**
 * Creates the demo accounts listed on the login page (when
 * NEXT_PUBLIC_DEMO_MODE=true). Uses the Supabase service-role key —
 * run this locally, never expose the key client-side.
 *
 * Usage:
 *   cp .env.example .env.local   # fill in URL + keys first
 *   node scripts/create-demo-users.mjs
 *
 * Idempotent: skips users that already exist in auth.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

// Load .env.local without a dotenv dependency
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Roles must satisfy the users.role CHECK constraint (admin/inspector/manager)
const DEMO_USERS = [
  { email: 'demoAdmin@lms.com', password: 'DemoAdmin123', username: 'demoAdmin', role: 'admin' },
  { email: 'demoManager@lms.com', password: 'DemoManager123', username: 'demoManager', role: 'manager' },
  { email: 'demoInspector@lms.com', password: 'DemoInspector123', username: 'demoInspector', role: 'inspector' },
  { email: 'demoUser@lms.com', password: 'DemoUser123', username: 'demoUser', role: 'inspector' },
]

for (const u of DEMO_USERS) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  })
  if (error) {
    console.log(`${u.email}: skipped (${error.message})`)
    continue
  }
  const { error: insertError } = await admin.from('users').upsert(
    {
      id: created.user.id,
      email: u.email,
      username: u.username,
      role: u.role,
      approval_status: 'approved',
    },
    { onConflict: 'id' }
  )
  console.log(`${u.email}: ${insertError ? 'auth created, profile failed — ' + insertError.message : 'created'}`)
}
console.log('Done. Enable NEXT_PUBLIC_DEMO_MODE=true to show them on the login page.')

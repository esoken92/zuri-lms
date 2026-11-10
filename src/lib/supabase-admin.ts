import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client for server-side routes only — bypasses RLS.
 * Never import into client components. Lazily created so the module
 * can be imported during build without env vars present.
 */
let cached: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return cached
}

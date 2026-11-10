import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Placeholder values keep the module importable without env so the build
// never breaks; calls fail at request time, so gate UI on
// isSupabaseConfigured and show a "not configured" state instead.
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://not-configured.supabase.invalid',
  supabaseAnonKey ?? 'not-configured'
)

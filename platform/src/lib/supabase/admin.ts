import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Schema-flexible client type (we target multiple Postgres schemas).
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Service-role Supabase client for server-side platform operations.
 * Bypasses RLS - ALL org scoping must be enforced explicitly in queries.
 * Never import this into client components.
 */
let cached: AnySupabaseClient | null = null;

export function supabaseAdmin(schema = "platform"): AnySupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  // Schema-specific clients are cheap; recreate per schema request.
  if (schema === "platform" && cached) return cached;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema },
  });
  if (schema === "platform") cached = client;
  return client;
}

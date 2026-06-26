import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  status: string;
}

/** The tenant subdomain for the current request, injected by middleware. */
export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get("x-org-slug");
}

/** Resolve the organization row for the current tenant subdomain. */
export async function getTenantOrg(): Promise<Organization | null> {
  const slug = await getTenantSlug();
  if (!slug) return null;
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("organizations")
    .select("id, slug, name, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Organization;
}

import { clerkClient, auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MODULE_LIST } from "@/platform/modules/registry";
import { syncOrganization, syncOrganizationMembers, setModuleEnabled } from "./actions";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to access the admin panel");
  }

  const client = await clerkClient();
  const { data: orgs } = await client.organizations.getOrganizationList({
    limit: 100,
  });

  // Keep the platform mirror of Clerk orgs in sync, then read enablement.
  const sb = supabaseAdmin("platform");
  for (const o of orgs) {
    try {
      await syncOrganization({
        id: o.id,
        slug: o.slug ?? o.id,
        name: o.name,
      });
      // Also sync organization members for RLS
      await syncOrganizationMembers(o.id);
    } catch (e: any) {
      console.error(`Failed to sync org ${o.id}:`, e?.message);
    }
  }

  const { data: enablement } = await sb
    .from("organization_modules")
    .select("org_id, module_id, enabled");

  const enabledMap = new Map<string, Set<string>>();
  for (const row of enablement ?? []) {
    if (!row.enabled) continue;
    if (!enabledMap.has(row.org_id)) enabledMap.set(row.org_id, new Set());
    enabledMap.get(row.org_id)!.add(row.module_id);
  }

  // Convert to plain object for client component serialization
  const enabledMapObj: Record<string, string[]> = {};
  for (const [orgId, modules] of enabledMap.entries()) {
    enabledMapObj[orgId] = Array.from(modules);
  }

  // Serialize orgs to plain objects for client component
  const serializedOrgs = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug ?? o.id,
  }));

  return (
    <AdminClient
      orgs={serializedOrgs}
      enabledMapObj={enabledMapObj}
      setModuleEnabled={setModuleEnabled}
      userId={userId!}
    />
  );
}

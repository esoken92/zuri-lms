"use server";

import { revalidatePath } from "next/cache";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/platform/org/access";
import { isModuleId } from "@/platform/modules/registry";

async function assertPlatformAdmin() {
  if (!(await isPlatformAdmin())) {
    throw new Error("Forbidden: platform admin only");
  }
}

/** Upsert a Clerk org into platform.organizations so we can attach modules. */
export async function syncOrganization(org: {
  id: string;
  slug: string;
  name: string;
}) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");
  await sb.from("organizations").upsert(
    {
      id: org.id,
      slug: org.slug,
      name: org.name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

/** Sync organization members from Clerk to platform.organization_members for RLS. */
export async function syncOrganizationMembers(orgId: string) {
  await assertPlatformAdmin();
  const client = await clerkClient();
  const sb = supabaseAdmin("platform");

  // Get all members of the organization from Clerk
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  // Upsert each member into platform.organization_members
  for (const membership of memberships.data) {
    if (!membership.publicUserData?.userId) continue;
    await sb.from("organization_members").upsert(
      {
        organization_id: orgId,
        user_id: membership.publicUserData.userId,
        role: membership.role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id" }
    );
  }
}

/** Enable or disable a module for an organization. */
export async function setModuleEnabled(
  orgId: string,
  moduleId: string,
  enabled: boolean,
  userId: string
) {
  await assertPlatformAdmin();
  if (!isModuleId(moduleId)) throw new Error("Unknown module");

  const sb = supabaseAdmin("platform");
  
  // Get current state for audit log
  const { data: current } = await sb
    .from("organization_modules")
    .select("*")
    .eq("org_id", orgId)
    .eq("module_id", moduleId)
    .single();
  
  const { error: upsertError } = await sb.from("organization_modules").upsert(
    {
      org_id: orgId,
      module_id: moduleId,
      enabled,
      enabled_at: enabled ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,module_id" }
  );
  if (upsertError) {
    throw new Error(`Failed to update module: ${upsertError.message}`);
  }

  // Log to audit
  const { error: auditError } = await sb.from("audit_log").insert({
    org_id: orgId,
    user_id: userId,
    action_type: enabled ? "org_module_enable" : "org_module_disable",
    module_id: moduleId,
    old_value: current ? { enabled: current.enabled } : null,
    new_value: { enabled },
  });
  if (auditError) {
    console.error("Audit log insert failed:", auditError.message);
  }

  revalidatePath("/admin");
}

import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PLATFORM_ADMIN_METADATA_KEY } from "@/platform/auth/roles";
import type { ModuleId } from "@/platform/modules/registry";

/** Is the signed-in user a Zuri staff/dev (cross-org oversight)? */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  return Boolean(user.publicMetadata?.[PLATFORM_ADMIN_METADATA_KEY]);
}

export interface OrgModuleRow {
  org_id: string;
  module_id: string;
  enabled: boolean;
  enabled_at: string | null;
  expires_at: string | null;
}

export interface MemberModuleRow {
  org_id: string;
  user_id: string;
  module_id: string;
  enabled: boolean;
  limits: any;
}

/** Module ids enabled (and not expired) for an organization. */
export async function getEnabledModules(orgId: string): Promise<ModuleId[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("organization_modules")
    .select("module_id, enabled, expires_at")
    .eq("org_id", orgId)
    .eq("enabled", true);
  if (error || !data) return [];
  const now = Date.now();
  return data
    .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
    .map((r) => r.module_id as ModuleId);
}

/** Module ids enabled for a specific user within an organization.
 * Checks member-level assignments first, falls back to org-level enablement.
 */
export async function getEnabledModulesForUser(orgId: string, userId: string): Promise<ModuleId[]> {
  const sb = supabaseAdmin("platform");
  
  // Get member-level assignments
  const { data: memberAssignments, error: memberError } = await sb
    .from("organization_member_modules")
    .select("module_id, enabled")
    .eq("org_id", orgId)
    .eq("user_id", userId);
  
  // Get org-level enabled modules
  const orgEnabled = await getEnabledModules(orgId);
  
  if (memberError || !memberAssignments || memberAssignments.length === 0) {
    // No member assignments, use org-level
    return orgEnabled;
  }
  
  // Build result: member-level explicit assignments override org-level
  const result = new Set<ModuleId>();
  const memberMap = new Map<string, boolean>();
  
  for (const m of memberAssignments) {
    memberMap.set(m.module_id, m.enabled);
  }
  
  for (const moduleId of orgEnabled) {
    // If member has explicit assignment, use that; otherwise inherit org enablement
    if (memberMap.has(moduleId)) {
      if (memberMap.get(moduleId)) {
        result.add(moduleId);
      }
    } else {
      result.add(moduleId);
    }
  }
  
  return Array.from(result);
}

export async function isModuleEnabled(orgId: string, moduleId: ModuleId): Promise<boolean> {
  const enabled = await getEnabledModules(orgId);
  return enabled.includes(moduleId);
}

export async function isModuleEnabledForUser(orgId: string, userId: string, moduleId: ModuleId): Promise<boolean> {
  const enabled = await getEnabledModulesForUser(orgId, userId);
  return enabled.includes(moduleId);
}

/**
 * Resolve the active org context for the current request.
 * Returns the Clerk active org id, or null if none selected.
 */
export async function getActiveOrgId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId ?? null;
}

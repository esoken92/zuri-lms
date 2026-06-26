import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MODULE_LIST } from "@/platform/modules/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

async function toggleModule(orgId: string, moduleId: string, enabled: boolean, userId: string) {
  "use server";
  const sb = supabaseAdmin("platform");
  
  // Get current state for audit log
  const { data: current } = await sb
    .from("organization_modules")
    .select("*")
    .eq("org_id", orgId)
    .eq("module_id", moduleId)
    .single();
  
  if (enabled) {
    const { error: upsertError } = await sb
      .from("organization_modules")
      .upsert({
        org_id: orgId,
        module_id: moduleId,
        enabled: true,
        enabled_at: new Date().toISOString(),
      },
      { onConflict: "org_id,module_id" }
    );
    if (upsertError) throw new Error(`Failed to enable module: ${upsertError.message}`);
  } else {
    const { error: updateError } = await sb
      .from("organization_modules")
      .update({ enabled: false })
      .eq("org_id", orgId)
      .eq("module_id", moduleId);
    if (updateError) throw new Error(`Failed to disable module: ${updateError.message}`);
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
}

async function toggleMemberModule(orgId: string, userId: string, moduleId: string, enabled: boolean, actorUserId: string) {
  "use server";
  const sb = supabaseAdmin("platform");
  
  // Get current state for audit log
  const { data: current } = await sb
    .from("organization_member_modules")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .single();
  
  if (enabled) {
    const { error: upsertError } = await sb
      .from("organization_member_modules")
      .upsert({
        org_id: orgId,
        user_id: userId,
        module_id: moduleId,
        enabled: true,
      },
      { onConflict: "org_id,user_id,module_id" }
    );
    if (upsertError) throw new Error(`Failed to grant module: ${upsertError.message}`);
  } else {
    const { error: updateError } = await sb
      .from("organization_member_modules")
      .update({ enabled: false })
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("module_id", moduleId);
    if (updateError) throw new Error(`Failed to revoke module: ${updateError.message}`);
  }

  // Log to audit
  const { error: auditError } = await sb.from("audit_log").insert({
    org_id: orgId,
    user_id: actorUserId,
    action_type: enabled ? "member_module_grant" : "member_module_revoke",
    module_id: moduleId,
    target_user_id: userId,
    old_value: current ? { enabled: current.enabled } : null,
    new_value: { enabled },
  });
  if (auditError) {
    console.error("Audit log insert failed:", auditError.message);
  }
}

export default async function OrgSettingsPage() {
  const { orgId, userId } = await auth();
  const user = await currentUser();

  if (!orgId) {
    redirect("/dashboard");
  }

  // Check if user is org admin
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId: userId! });
  const membership = memberships.data.find((m) => m.organization.id === orgId);
  const isAdmin = membership?.role === "admin" || membership?.role === "org:admin";

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
        Only organization administrators can manage module settings.
      </div>
    );
  }

  const sb = supabaseAdmin("platform");
  
  // Get org-level module enablement
  const { data: orgEnablement } = await sb
    .from("organization_modules")
    .select("module_id, enabled")
    .eq("org_id", orgId);

  const orgEnabledSet = new Set(
    (orgEnablement ?? []).filter((r) => r.enabled).map((r) => r.module_id)
  );

  // Get all org members
  const allMembers = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  });

  // Serialize members to plain objects for client component
  const serializedMembers = allMembers.data
    .filter((m) => m.publicUserData)
    .map((m) => ({
      userId: m.publicUserData!.userId,
      firstName: m.publicUserData!.firstName || "",
      lastName: m.publicUserData!.lastName || "",
      role: m.role,
    }));

  // Get member-level module assignments
  const { data: memberAssignments } = await sb
    .from("organization_member_modules")
    .select("user_id, module_id, enabled")
    .eq("org_id", orgId);

  // Build map of member module assignments
  const memberModuleMap = new Map<string, Map<string, boolean>>();
  for (const assignment of memberAssignments ?? []) {
    if (!memberModuleMap.has(assignment.user_id)) {
      memberModuleMap.set(assignment.user_id, new Map());
    }
    memberModuleMap.get(assignment.user_id)!.set(assignment.module_id, assignment.enabled);
  }

  return (
    <SettingsClient
      orgId={orgId}
      userId={userId!}
      orgEnabledSet={orgEnabledSet}
      allMembers={serializedMembers}
      memberModuleMap={memberModuleMap}
      toggleModule={toggleModule}
      toggleMemberModule={toggleMemberModule}
    />
  );
}

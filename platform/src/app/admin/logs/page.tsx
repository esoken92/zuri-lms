import { supabaseAdmin } from "@/lib/supabase/admin";
import { clerkClient } from "@clerk/nextjs/server";
import { LogsClient } from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const sb = supabaseAdmin("platform");

  const { data: logs } = await sb
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Resolve user names
  const userIds = [...new Set((logs ?? []).map((l: any) => l.user_id).filter(Boolean))];
  const client = await clerkClient();
  const userMap: Record<string, string> = {};
  for (const uid of userIds) {
    try {
      const user = await client.users.getUser(uid);
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      userMap[uid] = fullName || (user.emailAddresses?.[0]?.emailAddress ?? uid);
    } catch (e) {
      userMap[uid] = uid;
    }
  }

  // Resolve org names
  const orgIds = [...new Set((logs ?? []).map((l: any) => l.org_id).filter(Boolean))];
  const { data: orgs } = await sb.from("organizations").select("id, name").in("id", orgIds);
  const orgMap: Record<string, string> = {};
  for (const o of orgs ?? []) {
    orgMap[o.id] = o.name;
  }

  const serializedLogs = (logs ?? []).map((l: any) => ({
    id: l.id,
    org_id: l.org_id,
    org_name: orgMap[l.org_id] ?? l.org_id,
    user_id: l.user_id,
    user_name: userMap[l.user_id] ?? l.user_id,
    action_type: l.action_type,
    module_id: l.module_id,
    target_user_id: l.target_user_id,
    target_user_name: l.target_user_id ? (userMap[l.target_user_id] ?? l.target_user_id) : null,
    old_value: l.old_value,
    new_value: l.new_value,
    created_at: l.created_at,
    metadata: l.metadata,
  }));

  return <LogsClient logs={serializedLogs} />;
}

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEnabledModulesForUser } from "@/platform/org/access";
import { getModule, type ModuleId } from "@/platform/modules/registry";

/**
 * Server guard that renders module content only when:
 *  1. an organization is active, AND
 *  2. that organization has the module enabled for the user.
 * Otherwise shows a friendly "not available" panel.
 */
export async function ModuleGuard({
  module,
  children,
}: {
  module: ModuleId;
  children: React.ReactNode;
}) {
  const def = getModule(module);
  if (!def) redirect("/dashboard");

  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/dashboard");

  const enabled = await getEnabledModulesForUser(orgId, userId);
  if (!enabled.includes(module)) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h2 className="text-lg font-medium">{def!.name} isn&apos;t enabled</h2>
        <p className="mt-2 text-sm text-neutral-600">
          This module is not active for your account. Contact your organization
          administrator to enable it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getEnabledModulesForUser } from "@/platform/org/access";
import { MODULE_LIST, MODULES } from "@/platform/modules/registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function DashboardPage() {
  const { orgId, userId } = await auth();

  // No active organization selected yet.
  if (!orgId) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h2 className="text-lg font-medium">Select or create an organization</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Use the organization switcher in the top bar to choose a workspace.
          Each organization gets its own modules and data.
        </p>
      </div>
    );
  }

  const enabled = await getEnabledModulesForUser(orgId, userId!);

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Dashboard" },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your modules</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Modules enabled for this organization.
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">Settings</Button>
        </Link>
      </div>

      {enabled.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium">No modules enabled yet</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Go to Settings to enable modules for your organization.
          </p>
          <Link href="/dashboard/settings" className="mt-4 inline-block">
            <Button size="sm">Go to Settings</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enabled.map((id) => {
            const m = MODULES[id];
            return (
              <Link key={id} href={m.basePath}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{m.name}</CardTitle>
                    <CardDescription>{m.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-neutral-500">Not enabled</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_LIST.filter((m) => !enabled.includes(m.id)).map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500"
            >
              {m.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

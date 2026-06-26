import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { isPlatformAdmin } from "@/platform/org/access";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformAdmin = await isPlatformAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Zuri
          </Link>
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
              Dashboard
            </Link>
            <Link href="/dashboard/settings" className="text-neutral-600 hover:text-neutral-900">
              Settings
            </Link>
            <Link href="/dashboard/billing" className="text-neutral-600 hover:text-neutral-900">
              Billing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {platformAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Platform Admin
              </Button>
            </Link>
          )}
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

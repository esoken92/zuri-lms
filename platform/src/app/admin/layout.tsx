import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { isPlatformAdmin } from "@/platform/org/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isPlatformAdmin())) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-900 px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            Zuri Platform Admin
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-neutral-300 hover:text-white">
              Organizations
            </Link>
            <Link href="/admin/billing" className="text-neutral-300 hover:text-white">
              Billing
            </Link>
            <Link href="/admin/logs" className="text-neutral-300 hover:text-white">
              Activity Logs
            </Link>
          </nav>
          <Link href="/dashboard" className="text-sm text-neutral-300 hover:text-white">
            &larr; Back to app
          </Link>
        </div>
        <UserButton />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

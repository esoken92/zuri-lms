import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ModuleGuard } from "@/platform/modules/ModuleGuard";

export default function TyreSyncLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard module="tyresync">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Tyre Sync</h1>
            <p className="text-sm text-gray-600">Fleet tyre management & inspection</p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ModuleGuard>
  );
}

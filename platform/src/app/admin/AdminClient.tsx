"use client";

import { useState, useTransition } from "react";
import { MODULE_LIST } from "@/platform/modules/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface AdminClientProps {
  orgs: Array<{ id: string; name: string; slug: string }>;
  enabledMapObj: Record<string, string[]>;
  setModuleEnabled: (orgId: string, moduleId: string, enabled: boolean, userId: string) => Promise<void>;
  userId: string;
}

interface PendingChange {
  orgId: string;
  orgName: string;
  moduleId: string;
  moduleName: string;
  newEnabled: boolean;
}

export function AdminClient({
  orgs,
  enabledMapObj,
  setModuleEnabled,
  userId,
}: AdminClientProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Convert plain object to Set-based map for local state
  const initialMap = new Map<string, Set<string>>();
  for (const [orgId, modules] of Object.entries(enabledMapObj)) {
    initialMap.set(orgId, new Set(modules));
  }

  // Local state for unsaved changes
  const [localEnabledMap, setLocalEnabledMap] = useState(initialMap);

  function handleToggle(orgId: string, orgName: string, moduleId: string, moduleName: string, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;
    const newMap = new Map(localEnabledMap);
    if (!newMap.has(orgId)) {
      newMap.set(orgId, new Set());
    }
    const orgSet = newMap.get(orgId)!;
    if (newEnabled) {
      orgSet.add(moduleId);
    } else {
      orgSet.delete(moduleId);
    }
    setLocalEnabledMap(newMap);

    // Track pending change
    const existingIndex = pendingChanges.findIndex(
      (c) => c.orgId === orgId && c.moduleId === moduleId
    );
    const newChange: PendingChange = {
      orgId,
      orgName,
      moduleId,
      moduleName,
      newEnabled,
    };

    if (existingIndex >= 0) {
      const newChanges = [...pendingChanges];
      newChanges[existingIndex] = newChange;
      setPendingChanges(newChanges);
    } else {
      setPendingChanges([...pendingChanges, newChange]);
    }
  }

  function handleApplyChanges() {
    if (pendingChanges.length === 0) return;
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    startTransition(async () => {
      try {
        // Apply all pending changes
        for (const change of pendingChanges) {
          await setModuleEnabled(change.orgId, change.moduleId, change.newEnabled, userId);
        }
        // Update local state to reflect applied changes
        const newMap = new Map(localEnabledMap);
        for (const change of pendingChanges) {
          if (!newMap.has(change.orgId)) {
            newMap.set(change.orgId, new Set());
          }
          const orgSet = newMap.get(change.orgId)!;
          if (change.newEnabled) {
            orgSet.add(change.moduleId);
          } else {
            orgSet.delete(change.moduleId);
          }
        }
        setLocalEnabledMap(newMap);
        setPendingChanges([]);
        setToast({ message: `Success: ${pendingChanges.length} change(s) applied`, type: "success" });
      } catch (error: any) {
        console.error("Failed to apply changes:", error);
        const errMsg = error?.message || "Could not apply changes";
        setToast({ message: `Error: ${errMsg}`, type: "error" });
      }
    });
  }

  function handleDiscard() {
    setLocalEnabledMap(new Map(initialMap));
    setPendingChanges([]);
  }

  const hasChanges = pendingChanges.length > 0;

  return (
    <>
      <div className="space-y-8">
        <Breadcrumb
          items={[
            { label: "Admin" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Enable or disable modules per organization. {orgs.length} organization
              {orgs.length === 1 ? "" : "s"}.
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDiscard} disabled={isPending}>
                Discard ({pendingChanges.length})
              </Button>
              <Button onClick={handleApplyChanges} disabled={isPending}>
                Apply Changes ({pendingChanges.length})
              </Button>
            </div>
          )}
        </div>

        {orgs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
            No organizations yet. Create one from the dashboard organization
            switcher, then return here to assign modules.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {orgs.map((o) => {
              const enabled = localEnabledMap.get(o.id) ?? new Set<string>();
              return (
                <Card key={o.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{o.name}</span>
                      <span className="text-xs font-normal text-neutral-400">
                        {o.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {MODULE_LIST.map((m) => {
                      const isEnabled = enabled.has(m.id);
                      const isChanged = pendingChanges.some(
                        (c) => c.orgId === o.id && c.moduleId === m.id
                      );
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            isChanged ? "border-amber-400 bg-amber-50" : "border-neutral-200"
                          }`}
                        >
                          <span className="text-sm">{m.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggle(o.id, o.name, m.id, m.name, isEnabled)}
                            disabled={isPending}
                            aria-pressed={isEnabled}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
                              isEnabled ? "bg-emerald-600" : "bg-neutral-300"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                                isEnabled && "translate-x-5"
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogHeader>
          <DialogTitle>Apply Changes</DialogTitle>
          <DialogDescription>
            You are about to apply {pendingChanges.length} change(s):
          </DialogDescription>
          <ul className="mt-2 list-disc list-inside text-sm text-neutral-600">
            {pendingChanges.map((c, i) => (
              <li key={i}>
                {c.orgName} - {c.moduleName}: {c.newEnabled ? "Enable" : "Disable"}
              </li>
            ))}
          </ul>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

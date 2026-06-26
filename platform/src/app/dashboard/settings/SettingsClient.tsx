"use client";

import { useState, useTransition } from "react";
import { MODULE_LIST } from "@/platform/modules/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface SettingsClientProps {
  orgId: string;
  userId: string;
  orgEnabledSet: Set<string>;
  allMembers: Array<{ userId: string; firstName: string; lastName: string; role: string }>;
  memberModuleMap: Map<string, Map<string, boolean>>;
  toggleModule: (orgId: string, moduleId: string, enabled: boolean, userId: string) => Promise<void>;
  toggleMemberModule: (orgId: string, userId: string, moduleId: string, enabled: boolean, actorUserId: string) => Promise<void>;
}

interface PendingChange {
  type: "org" | "member";
  moduleId: string;
  moduleName: string;
  newEnabled: boolean;
  userId?: string;
  userName?: string;
}

export function SettingsClient({
  orgId,
  userId,
  orgEnabledSet,
  allMembers,
  memberModuleMap,
  toggleModule,
  toggleMemberModule,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Local state for unsaved changes
  const [localOrgEnabled, setLocalOrgEnabled] = useState(new Set(orgEnabledSet));
  const [localMemberModules, setLocalMemberModules] = useState(new Map(memberModuleMap));

  function handleOrgModuleToggle(moduleId: string, moduleName: string, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;
    const newSet = new Set(localOrgEnabled);
    if (newEnabled) {
      newSet.add(moduleId);
    } else {
      newSet.delete(moduleId);
    }
    setLocalOrgEnabled(newSet);

    // Track pending change
    const existingIndex = pendingChanges.findIndex(
      (c) => c.type === "org" && c.moduleId === moduleId
    );
    const newChange: PendingChange = {
      type: "org",
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

  function handleMemberModuleToggle(
    userId: string,
    userName: string,
    moduleId: string,
    moduleName: string,
    currentEnabled: boolean,
    hasOverride: boolean
  ) {
    const newEnabled = hasOverride ? !currentEnabled : false;
    const newMap = new Map(localMemberModules);
    if (!newMap.has(userId)) {
      newMap.set(userId, new Map());
    }
    newMap.get(userId)!.set(moduleId, newEnabled);
    setLocalMemberModules(newMap);

    // Track pending change
    const existingIndex = pendingChanges.findIndex(
      (c) => c.type === "member" && c.moduleId === moduleId && c.userId === userId
    );
    const newChange: PendingChange = {
      type: "member",
      moduleId,
      moduleName,
      newEnabled,
      userId,
      userName,
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
          if (change.type === "org") {
            await toggleModule(orgId, change.moduleId, change.newEnabled, userId);
          } else {
            await toggleMemberModule(orgId, change.userId!, change.moduleId, change.newEnabled, userId);
          }
        }
        // Update local state to reflect applied changes
        const newOrgSet = new Set(localOrgEnabled);
        const newMemberMap = new Map(localMemberModules);
        
        for (const change of pendingChanges) {
          if (change.type === "org") {
            if (change.newEnabled) {
              newOrgSet.add(change.moduleId);
            } else {
              newOrgSet.delete(change.moduleId);
            }
          } else {
            if (!newMemberMap.has(change.userId!)) {
              newMemberMap.set(change.userId!, new Map());
            }
            newMemberMap.get(change.userId!)!.set(change.moduleId, change.newEnabled);
          }
        }
        
        setLocalOrgEnabled(newOrgSet);
        setLocalMemberModules(newMemberMap);
        setPendingChanges([]);
        setToast({ message: `Success: ${pendingChanges.length} change(s) applied`, type: "success" });
      } catch (error) {
        console.error("Failed to apply changes:", error);
        setToast({ message: `Failure: Could not apply changes`, type: "error" });
      }
    });
  }

  function handleDiscard() {
    setLocalOrgEnabled(new Set(orgEnabledSet));
    setLocalMemberModules(new Map(memberModuleMap));
    setPendingChanges([]);
  }

  const hasChanges = pendingChanges.length > 0;

  return (
    <>
      <div className="space-y-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Organization Settings</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage modules for your organization and individual members.
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

        <Card>
          <CardHeader>
            <CardTitle>Organization Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MODULE_LIST.map((m) => {
              const isEnabled = localOrgEnabled.has(m.id);
              const isChanged = pendingChanges.some(
                (c) => c.type === "org" && c.moduleId === m.id
              );
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    isChanged ? "border-amber-400 bg-amber-50" : "border-neutral-200"
                  }`}
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-neutral-600">{m.description}</div>
                  </div>
                  <Button
                    type="button"
                    variant={isEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleOrgModuleToggle(m.id, m.name, isEnabled)}
                    disabled={isPending}
                  >
                    {isEnabled ? "Enabled" : "Enable"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Module Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {allMembers.map((member) => {
              const memberModules = localMemberModules.get(member.userId) || new Map();
              
              return (
                <div key={member.userId} className="space-y-3">
                  <div className="font-medium">{member.firstName} {member.lastName}</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {MODULE_LIST.map((m) => {
                      const orgEnabled = localOrgEnabled.has(m.id);
                      const memberEnabled = memberModules.get(m.id);
                      
                      // If org doesn't have module, don't show
                      if (!orgEnabled) return null;
                      
                      // If member has explicit assignment, use that; otherwise inherit org enablement
                      const isEnabled = memberEnabled !== undefined ? memberEnabled : true;
                      const hasOverride = memberEnabled !== undefined;
                      const isChanged = pendingChanges.some(
                        (c) => c.type === "member" && c.moduleId === m.id && c.userId === member.userId
                      );
                      
                      return (
                        <Button
                          key={m.id}
                          type="button"
                          variant={isEnabled ? "default" : "outline"}
                          size="sm"
                          className={`w-full ${isChanged ? "border-amber-400" : ""}`}
                          onClick={() => handleMemberModuleToggle(
                            member.userId,
                            `${member.firstName} ${member.lastName}`,
                            m.id,
                            m.name,
                            isEnabled,
                            hasOverride
                          )}
                          disabled={isPending}
                        >
                          {m.name}
                          {hasOverride && <span className="ml-1 text-xs opacity-70">*</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
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
                {c.type === "org"
                  ? `${c.moduleName}: ${c.newEnabled ? "Enable" : "Disable"}`
                  : `${c.moduleName} for ${c.userName}: ${c.newEnabled ? "Grant" : "Revoke"}`
                }
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

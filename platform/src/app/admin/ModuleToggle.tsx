"use client";

import { useState, useTransition } from "react";
import { setModuleEnabled } from "./actions";
import { cn } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function ModuleToggle({
  orgId,
  moduleId,
  moduleName,
  initialEnabled,
  userId,
  onToggle,
}: {
  orgId: string;
  moduleId: string;
  moduleName: string;
  initialEnabled: boolean;
  userId: string;
  onToggle: (moduleId: string, newEnabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    onToggle(moduleId, next);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
      <span className="text-sm">{moduleName}</span>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={enabled}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
          enabled ? "bg-emerald-600" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            enabled && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

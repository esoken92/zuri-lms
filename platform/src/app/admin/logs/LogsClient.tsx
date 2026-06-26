"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface LogEntry {
  id: string;
  org_id: string;
  org_name: string;
  user_id: string;
  user_name: string;
  action_type: string;
  module_id: string;
  target_user_id: string | null;
  target_user_name: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
  metadata: any;
}

interface LogsClientProps {
  logs: LogEntry[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  org_module_enable: { label: "Module Enabled", color: "bg-green-100 text-green-700" },
  org_module_disable: { label: "Module Disabled", color: "bg-red-100 text-red-700" },
  member_module_grant: { label: "Member Access Granted", color: "bg-blue-100 text-blue-700" },
  member_module_revoke: { label: "Member Access Revoked", color: "bg-orange-100 text-orange-700" },
  billing_config_set: { label: "Billing Config Updated", color: "bg-purple-100 text-purple-700" },
  payment_recorded: { label: "Payment Recorded", color: "bg-green-100 text-green-700" },
  override_created: { label: "Billing Override", color: "bg-yellow-100 text-yellow-700" },
  invoice_generated: { label: "Invoice Generated", color: "bg-indigo-100 text-indigo-700" },
  usage_metered: { label: "Usage Metered", color: "bg-gray-100 text-gray-700" },
  custom_pricing_set: { label: "Custom Pricing Set", color: "bg-purple-100 text-purple-700" },
};

function formatValue(val: any): string {
  if (!val) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LogsClient({ logs }: LogsClientProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const actionTypes = [...new Set(logs.map((l) => l.action_type))];

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.action_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.org_name.toLowerCase().includes(q) ||
        l.user_name.toLowerCase().includes(q) ||
        l.action_type.toLowerCase().includes(q) ||
        l.module_id.toLowerCase().includes(q) ||
        (l.target_user_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Activity Logs" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-sm text-neutral-500">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"} (showing last 200)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]?.label ?? a}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by org, user, module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Logs table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-400">
            No log entries found
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Module</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action_type] ?? {
                    label: log.action_type,
                    color: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                        {formatTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{log.org_name}</td>
                      <td className="px-4 py-3 text-neutral-700">{log.user_name}</td>
                      <td className="px-4 py-3 text-neutral-600">{log.module_id}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {log.target_user_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.old_value || log.new_value ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-neutral-400 hover:text-neutral-600">
                              View
                            </summary>
                            <div className="mt-2 space-y-1 text-xs">
                              {log.old_value && (
                                <div>
                                  <span className="font-medium text-red-600">Old:</span>
                                  <pre className="mt-1 rounded bg-red-50 p-2 text-red-700 overflow-x-auto">
                                    {formatValue(log.old_value)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <span className="font-medium text-green-600">New:</span>
                                  <pre className="mt-1 rounded bg-green-50 p-2 text-green-700 overflow-x-auto">
                                    {formatValue(log.new_value)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

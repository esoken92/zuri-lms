"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { UsageRecord, Invoice, Payment, OrgBilling } from "@/platform/billing";

interface BillingClientProps {
  orgId: string;
  billing: OrgBilling | null;
  usage: UsageRecord[];
  invoices: Array<Invoice & { line_items: any[] }>;
  payments: Payment[];
  formatCents: (cents: number, currency?: string) => string;
}

type Tab = "overview" | "usage" | "invoices" | "payments";

export function BillingClient({
  orgId,
  billing,
  usage,
  invoices,
  payments,
  formatCents,
}: BillingClientProps) {
  const [tab, setTab] = useState<Tab>("overview");

  const currentUsage = usage[0];
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const outstandingInvoices = invoices.filter(
    (i) => i.status === "sent" || i.status === "partial" || i.status === "overdue"
  );
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.total_cents, 0);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "usage", label: "Usage" },
    { id: "invoices", label: "Invoices" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Billing" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {billing
            ? `Plan: ${billing.plan_id ?? "standard"} · Method: ${billing.billing_method}`
            : "No billing configuration yet. Contact your platform admin."}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">
                Current Period Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {currentUsage
                  ? formatCents(currentUsage.total_charge_cents, billing?.currency)
                  : "—"}
              </p>
              {currentUsage && (
                <p className="mt-1 text-xs text-neutral-500">
                  {currentUsage.seat_count} seats · {currentUsage.storage_gb} GB storage
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {outstandingTotal > 0
                  ? formatCents(outstandingTotal, billing?.currency)
                  : "R0.00"}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {outstandingInvoices.length} unpaid invoice
                {outstandingInvoices.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">
                Total Paid (All Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCents(totalPaid, billing?.currency)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {payments.length} payment{payments.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          {billing?.billing_method === "manual" && (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Manual Billing (EFT)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <p>
                  Your account is on manual billing. Please make EFT payments to:
                </p>
                <div className="rounded-lg bg-neutral-50 p-4 font-mono text-xs">
                  <p>Bank: FNB</p>
                  <p>Account: Zuri Platform</p>
                  <p>Account No: 6200 1234 5678</p>
                  <p>Branch: 250655</p>
                  <p>Reference: {orgId.slice(-8).toUpperCase()}</p>
                </div>
                <p>
                  Email proof of payment to{" "}
                  <span className="font-medium">billing@zuri.com</span> or upload
                  via the Payments tab.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "usage" && (
        <div className="space-y-4">
          {usage.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
              No usage records yet. Usage is calculated based on active seats and storage.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Seats</th>
                    <th className="px-4 py-3 text-right">Storage (GB)</th>
                    <th className="px-4 py-3 text-right">Seat Charge</th>
                    <th className="px-4 py-3 text-right">Storage</th>
                    <th className="px-4 py-3 text-right">Platform Fee</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {usage.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.period_month}</td>
                      <td className="px-4 py-3 text-right">{u.seat_count}</td>
                      <td className="px-4 py-3 text-right">{u.storage_gb}</td>
                      <td className="px-4 py-3 text-right">{formatCents(u.seat_charge_cents, billing?.currency)}</td>
                      <td className="px-4 py-3 text-right">{formatCents(u.storage_charge_cents, billing?.currency)}</td>
                      <td className="px-4 py-3 text-right">{formatCents(u.platform_fee_cents, billing?.currency)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCents(u.total_charge_cents, billing?.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          u.status === "invoiced" ? "bg-blue-100 text-blue-700" :
                          u.status === "overridden" ? "bg-amber-100 text-amber-700" :
                          "bg-neutral-100 text-neutral-600"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
              No invoices yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">Tax (VAT)</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.period_month}</td>
                      <td className="px-4 py-3 text-right">{formatCents(inv.subtotal_cents, billing?.currency)}</td>
                      <td className="px-4 py-3 text-right">{formatCents(inv.tax_cents, billing?.currency)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCents(inv.total_cents, billing?.currency)}</td>
                      <td className="px-4 py-3">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          inv.status === "draft" ? "bg-neutral-100 text-neutral-600" :
                          inv.status === "overdue" ? "bg-red-100 text-red-700" :
                          inv.status === "partial" ? "bg-amber-100 text-amber-700" :
                          inv.status === "void" || inv.status === "written_off" ? "bg-neutral-100 text-neutral-400 line-through" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        {new Date(p.paid_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCents(p.amount_cents, p.currency)}
                      </td>
                      <td className="px-4 py-3 uppercase">{p.method}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.bank_reference ?? p.stripe_payment_id ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          p.status === "pending" ? "bg-amber-100 text-amber-700" :
                          p.status === "failed" ? "bg-red-100 text-red-700" :
                          "bg-neutral-100 text-neutral-600"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{p.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

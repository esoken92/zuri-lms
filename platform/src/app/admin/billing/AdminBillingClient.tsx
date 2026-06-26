"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  setOrgBillingAction,
  recordPaymentAction,
  createOverrideAction,
  generateInvoiceAction,
  meterUsageAction,
  setCustomPricingAction,
} from "./actions";
import type { BillingPlan } from "@/platform/billing";

interface OrgBillingData {
  id: string;
  name: string;
  slug: string;
  billing: any;
  latestUsage: any;
  invoices: any[];
  payments: any[];
  overrides: any[];
}

interface AdminBillingClientProps {
  orgs: OrgBillingData[];
  plans: BillingPlan[];
  userId: string;
  formatCents: (cents: number, currency?: string) => string;
}

type DialogType = "billing" | "payment" | "override" | "invoice" | "custom_pricing" | null;

export function AdminBillingClient({
  orgs,
  plans,
  userId,
  formatCents,
}: AdminBillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrgBillingData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [planId, setPlanId] = useState("standard");
  const [billingMethod, setBillingMethod] = useState<"stripe" | "manual">("stripe");
  const [billingDay, setBillingDay] = useState(1);
  const [billingEmail, setBillingEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "eft" | "cash" | "cheque" | "other">("eft");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [overrideType, setOverrideType] = useState<"discount" | "surcharge" | "fixed_amount" | "credit" | "waive">("discount");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overridePeriod, setOverridePeriod] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [invoicePeriod, setInvoicePeriod] = useState("");

  // Custom pricing form state
  const [customSeatPrice, setCustomSeatPrice] = useState("");
  const [customStoragePrice, setCustomStoragePrice] = useState("");
  const [customPlatformFee, setCustomPlatformFee] = useState("");
  const [customDiscountPercent, setCustomDiscountPercent] = useState("");
  const [customPricingPeriod, setCustomPricingPeriod] = useState("");
  const [customPricingReason, setCustomPricingReason] = useState("");

  function openDialog(type: DialogType, org: OrgBillingData) {
    setSelectedOrg(org);
    setDialogType(type);
    // Pre-fill form fields
    if (org.billing) {
      setPlanId(org.billing.plan_id ?? "standard");
      setBillingMethod(org.billing.billing_method ?? "stripe");
      setBillingDay(org.billing.billing_day ?? 1);
      setBillingEmail(org.billing.billing_email ?? "");
      setTaxNumber(org.billing.tax_number ?? "");
      setAdminNotes(org.billing.admin_notes ?? "");
    }
    setInvoicePeriod(new Date().toISOString().slice(0, 7));
  }

  function closeDialog() {
    setDialogType(null);
    setSelectedOrg(null);
  }

  function handleSaveBilling() {
    if (!selectedOrg) return;
    startTransition(async () => {
      try {
        await setOrgBillingAction(selectedOrg.id, {
          plan_id: planId,
          billing_method: billingMethod,
          billing_day: billingDay,
          billing_email: billingEmail || undefined,
          tax_number: taxNumber || undefined,
          admin_notes: adminNotes || undefined,
        });
        setToast({ message: "Billing config saved", type: "success" });
        closeDialog();
      } catch (e: any) {
        setToast({ message: e.message, type: "error" });
      }
    });
  }

  function handleRecordPayment() {
    if (!selectedOrg) return;
    startTransition(async () => {
      try {
        await recordPaymentAction(
          selectedOrg.id,
          paymentInvoiceId || null,
          Math.round(parseFloat(paymentAmount) * 100),
          paymentMethod,
          paymentRef || null,
          paymentNotes || null,
          userId
        );
        setToast({ message: "Payment recorded", type: "success" });
        closeDialog();
      } catch (e: any) {
        setToast({ message: e.message, type: "error" });
      }
    });
  }

  function handleCreateOverride() {
    if (!selectedOrg) return;
    startTransition(async () => {
      try {
        await createOverrideAction(
          selectedOrg.id,
          overridePeriod || null,
          overrideType,
          Math.round(parseFloat(overrideAmount || "0") * 100),
          overrideReason,
          userId
        );
        setToast({ message: "Override created", type: "success" });
        closeDialog();
      } catch (e: any) {
        setToast({ message: e.message, type: "error" });
      }
    });
  }

  function handleGenerateInvoice() {
    if (!selectedOrg) return;
    startTransition(async () => {
      try {
        await generateInvoiceAction(selectedOrg.id, invoicePeriod, userId);
        setToast({ message: "Invoice generated", type: "success" });
        closeDialog();
      } catch (e: any) {
        setToast({ message: e.message, type: "error" });
      }
    });
  }

  function handleMeterUsage(org: OrgBillingData) {
    startTransition(async () => {
      try {
        await meterUsageAction(org.id);
        setToast({ message: `Usage metered for ${org.name}`, type: "success" });
      } catch (e: any) {
        setToast({ message: e.message, type: "error" });
      }
    });
  }

  return (
    <>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Billing" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing Console</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage billing plans, record manual EFT payments, create overrides, and generate invoices.
          </p>
        </div>

        {/* Plans summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-sm">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Seat/month:</span>
                  <span className="font-medium">{formatCents(p.seat_price_monthly_cents, p.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage/GB:</span>
                  <span className="font-medium">{formatCents(p.storage_price_gb_monthly_cents, p.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee:</span>
                  <span className="font-medium">{formatCents(p.platform_fee_monthly_cents, p.currency)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Org billing table */}
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Current Usage</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orgs.map((o) => {
                const outstanding = o.invoices
                  .filter((i) => ["sent", "partial", "overdue"].includes(i.status))
                  .reduce((sum, i) => sum + i.total_cents, 0);
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">{o.name}</td>
                    <td className="px-4 py-3">{o.billing?.plan_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.billing?.billing_method === "manual"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {o.billing?.billing_method ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.latestUsage
                        ? formatCents(o.latestUsage.total_charge_cents)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {outstanding > 0 ? (
                        <span className="font-semibold text-red-600">
                          {formatCents(outstanding)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMeterUsage(o)}
                          disabled={isPending}
                        >
                          Meter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("billing", o)}
                        >
                          Config
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("invoice", o)}
                        >
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("payment", o)}
                        >
                          Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("override", o)}
                        >
                          Override
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("custom_pricing", o)}
                        >
                          Custom Price
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Overrides list */}
        {orgs.some((o) => o.overrides.length > 0) && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Recent Overrides</h2>
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Org</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orgs
                    .filter((o) => o.overrides.length > 0)
                    .flatMap((o) =>
                      o.overrides.map((ov) => (
                        <tr key={ov.id}>
                          <td className="px-4 py-3 font-medium">{o.name}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              {ov.override_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCents(ov.amount_cents)}
                          </td>
                          <td className="px-4 py-3">{ov.period_month ?? "all"}</td>
                          <td className="px-4 py-3 text-neutral-600">{ov.reason}</td>
                          <td className="px-4 py-3">
                            {ov.applied_at ? "Yes" : "Pending"}
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Billing Config Dialog */}
      <Dialog open={dialogType === "billing"} onOpenChange={(v) => !v && closeDialog()}>
        <div>
          <DialogHeader>
            <DialogTitle>Billing Config - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>Set billing plan and method for this organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCents(p.seat_price_monthly_cents)}/seat
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Billing Method</label>
              <select
                value={billingMethod}
                onChange={(e) => setBillingMethod(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="stripe">Stripe (automated)</option>
                <option value="manual">Manual (EFT/cash)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Billing Day (1-28)</label>
              <input
                type="number"
                min={1}
                max={28}
                value={billingDay}
                onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Billing Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="finance@company.com"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tax/VAT Number</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSaveBilling} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={dialogType === "payment"} onOpenChange={(v) => !v && closeDialog()}>
        <div>
          <DialogHeader>
            <DialogTitle>Record Payment - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>Record a manual EFT, cash, or other payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount (ZAR)</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="eft">EFT</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="stripe">Stripe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Link to Invoice (optional)</label>
              <select
                value={paymentInvoiceId}
                onChange={(e) => setPaymentInvoiceId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {selectedOrg?.invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {formatCents(inv.total_cents)} ({inv.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Bank Reference</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="EFT ref / deposit slip no."
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={isPending || !paymentAmount}>
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={dialogType === "override"} onOpenChange={(v) => !v && closeDialog()}>
        <div>
          <DialogHeader>
            <DialogTitle>Billing Override - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Apply a discount, surcharge, credit, or waive charges for a billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Override Type</label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="discount">Discount (reduce charge)</option>
                <option value="surcharge">Surcharge (add charge)</option>
                <option value="fixed_amount">Fixed Amount (override total)</option>
                <option value="credit">Credit (apply balance)</option>
                <option value="waive">Waive (zero charge)</option>
              </select>
            </div>
            {overrideType !== "waive" && (
              <div>
                <label className="text-sm font-medium">Amount (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Period (leave empty for all future)</label>
              <input
                type="month"
                value={overridePeriod}
                onChange={(e) => setOverridePeriod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Reason for override..."
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleCreateOverride} disabled={isPending || !overrideReason}>
              {isPending ? "Creating..." : "Create Override"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={dialogType === "invoice"} onOpenChange={(v) => !v && closeDialog()}>
        <div>
          <DialogHeader>
            <DialogTitle>Generate Invoice - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Generate an invoice from usage data for a billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Billing Period</label>
              <input
                type="month"
                value={invoicePeriod}
                onChange={(e) => setInvoicePeriod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            {selectedOrg?.latestUsage && (
              <div className="rounded-lg bg-neutral-50 p-4 text-sm">
                <p className="font-medium">Latest Usage:</p>
                <p className="text-neutral-600">
                  {selectedOrg.latestUsage.seat_count} seats ·{" "}
                  {selectedOrg.latestUsage.storage_gb} GB ·{" "}
                  {formatCents(selectedOrg.latestUsage.total_charge_cents)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleGenerateInvoice} disabled={isPending}>
              {isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Custom Pricing Dialog */}
      <Dialog open={dialogType === "custom_pricing"} onOpenChange={(v) => !v && closeDialog()}>
        <div>
          <DialogHeader>
            <DialogTitle>Custom Pricing - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Override individual pricing fields for this org. Leave a field empty to inherit from the plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
              Leave any field blank to use the plan default. Set a discount % to reduce the total.
            </div>
            <div>
              <label className="text-sm font-medium">Seat Price / month (R)</label>
              <input
                type="number"
                step="0.01"
                value={customSeatPrice}
                onChange={(e) => setCustomSeatPrice(e.target.value)}
                placeholder="Plan default"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Storage Price / GB-month (R)</label>
              <input
                type="number"
                step="0.01"
                value={customStoragePrice}
                onChange={(e) => setCustomStoragePrice(e.target.value)}
                placeholder="Plan default"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Platform Fee / month (R)</label>
              <input
                type="number"
                step="0.01"
                value={customPlatformFee}
                onChange={(e) => setCustomPlatformFee(e.target.value)}
                placeholder="Plan default"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount % (applied to total)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={customDiscountPercent}
                onChange={(e) => setCustomDiscountPercent(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Period (leave empty for all future)</label>
              <input
                type="month"
                value={customPricingPeriod}
                onChange={(e) => setCustomPricingPeriod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                value={customPricingReason}
                onChange={(e) => setCustomPricingReason(e.target.value)}
                rows={2}
                placeholder="Reason for custom pricing..."
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedOrg) return;
                startTransition(async () => {
                  try {
                    await setCustomPricingAction(
                      selectedOrg.id,
                      {
                        period_month: customPricingPeriod || null,
                        seat_price_monthly_cents: customSeatPrice ? Math.round(parseFloat(customSeatPrice) * 100) : null,
                        storage_price_gb_monthly_cents: customStoragePrice ? Math.round(parseFloat(customStoragePrice) * 100) : null,
                        platform_fee_monthly_cents: customPlatformFee ? Math.round(parseFloat(customPlatformFee) * 100) : null,
                        discount_percent: customDiscountPercent ? parseFloat(customDiscountPercent) : 0,
                        reason: customPricingReason || undefined,
                      },
                      userId
                    );
                    setToast({ message: "Custom pricing set", type: "success" });
                    closeDialog();
                  } catch (e: any) {
                    setToast({ message: e.message, type: "error" });
                  }
                });
              }}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Set Custom Pricing"}
            </Button>
          </DialogFooter>
        </div>
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

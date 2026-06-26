import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getOrgBilling,
  getUsageRecords,
  getInvoices,
  getPayments,
  formatCents,
} from "@/platform/billing";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { orgId, userId } = await auth();
  if (!orgId) redirect("/dashboard");

  const billing = await getOrgBilling(orgId);
  const usage = await getUsageRecords(orgId);
  const invoices = await getInvoices(orgId);
  const payments = await getPayments(orgId);

  const serializedUsage = usage.map((u) => ({
    id: u.id,
    org_id: u.org_id,
    period_month: u.period_month,
    seat_count: u.seat_count,
    storage_bytes: u.storage_bytes,
    storage_gb: u.storage_gb,
    seat_charge_cents: u.seat_charge_cents,
    storage_charge_cents: u.storage_charge_cents,
    platform_fee_cents: u.platform_fee_cents,
    total_charge_cents: u.total_charge_cents,
    status: u.status,
  }));

  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    line_items: inv.line_items as any,
  }));

  return (
    <BillingClient
      orgId={orgId}
      billing={billing}
      usage={serializedUsage}
      invoices={serializedInvoices}
      payments={payments}
      formatCents={formatCents}
    />
  );
}

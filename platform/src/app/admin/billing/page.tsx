import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getAllOrgBilling,
  getBillingPlans,
  formatCents,
} from "@/platform/billing";
import { AdminBillingClient } from "./AdminBillingClient";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const { userId } = await auth();
  const client = await clerkClient();
  const { data: orgs } = await client.organizations.getOrganizationList({
    limit: 100,
  });

  const sb = supabaseAdmin("platform");

  // Get all billing configs
  const { data: billingRows } = await sb.from("org_billing").select("*");
  const billingMap = new Map(
    (billingRows ?? []).map((b: any) => [b.org_id, b])
  );

  // Get all usage records (latest per org)
  const { data: usageRows } = await sb
    .from("usage_records")
    .select("*")
    .order("period_month", { ascending: false });
  const latestUsageMap = new Map<string, any>();
  for (const u of usageRows ?? []) {
    if (!latestUsageMap.has(u.org_id)) {
      latestUsageMap.set(u.org_id, u);
    }
  }

  // Get all invoices
  const { data: invoiceRows } = await sb
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const invoicesByOrg = new Map<string, any[]>();
  for (const inv of invoiceRows ?? []) {
    if (!invoicesByOrg.has(inv.org_id)) {
      invoicesByOrg.set(inv.org_id, []);
    }
    invoicesByOrg.get(inv.org_id)!.push(inv);
  }

  // Get all payments
  const { data: paymentRows } = await sb
    .from("payments")
    .select("*")
    .order("paid_at", { ascending: false })
    .limit(100);
  const paymentsByOrg = new Map<string, any[]>();
  for (const p of paymentRows ?? []) {
    if (!paymentsByOrg.has(p.org_id)) {
      paymentsByOrg.set(p.org_id, []);
    }
    paymentsByOrg.get(p.org_id)!.push(p);
  }

  // Get all overrides
  const { data: overrideRows } = await sb
    .from("billing_overrides")
    .select("*")
    .order("created_at", { ascending: false });
  const overridesByOrg = new Map<string, any[]>();
  for (const o of overrideRows ?? []) {
    if (!overridesByOrg.has(o.org_id)) {
      overridesByOrg.set(o.org_id, []);
    }
    overridesByOrg.get(o.org_id)!.push(o);
  }

  const plans = await getBillingPlans();

  const serializedOrgs = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug ?? o.id,
    billing: billingMap.get(o.id) ?? null,
    latestUsage: latestUsageMap.get(o.id) ?? null,
    invoices: invoicesByOrg.get(o.id) ?? [],
    payments: paymentsByOrg.get(o.id) ?? [],
    overrides: overridesByOrg.get(o.id) ?? [],
  }));

  return (
    <AdminBillingClient
      orgs={serializedOrgs}
      plans={plans}
      userId={userId!}
      formatCents={formatCents}
    />
  );
}

import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ModuleId } from "@/platform/modules/registry";

export interface BillingPlan {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  seat_price_monthly_cents: number;
  storage_price_gb_monthly_cents: number;
  platform_fee_monthly_cents: number;
  is_active: boolean;
}

export interface OrgBilling {
  org_id: string;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_method: "stripe" | "manual";
  billing_day: number;
  currency: string;
  billing_email: string | null;
  tax_number: string | null;
  admin_notes: string | null;
}

export interface UsageRecord {
  id: string;
  org_id: string;
  period_month: string;
  seat_count: number;
  storage_bytes: number;
  storage_gb: number;
  seat_charge_cents: number;
  storage_charge_cents: number;
  platform_fee_cents: number;
  total_charge_cents: number;
  status: "pending" | "invoiced" | "paid" | "overridden";
}

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  period_month: string;
  line_items: InvoiceLineItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void" | "written_off";
  stripe_invoice_id: string | null;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
  notes: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface Payment {
  id: string;
  org_id: string;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  method: "stripe" | "eft" | "cash" | "cheque" | "other";
  stripe_payment_id: string | null;
  bank_reference: string | null;
  recorded_by: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  proof_file_key: string | null;
  notes: string | null;
  paid_at: string;
}

export interface BillingOverride {
  id: string;
  org_id: string;
  period_month: string | null;
  override_type: "discount" | "surcharge" | "fixed_amount" | "credit" | "waive";
  amount_cents: number;
  reason: string;
  created_by: string | null;
  applied_to_invoice: string | null;
  applied_at: string | null;
}

export interface CustomPricing {
  id: string;
  org_id: string;
  period_month: string | null;
  seat_price_monthly_cents: number | null;
  storage_price_gb_monthly_cents: number | null;
  platform_fee_monthly_cents: number | null;
  discount_percent: number;
  reason: string | null;
  set_by: string | null;
  is_active: boolean;
}

export interface EffectivePricing {
  seat_price_monthly_cents: number;
  storage_price_gb_monthly_cents: number;
  platform_fee_monthly_cents: number;
  discount_percent: number;
  source: "plan" | "custom";
  custom_pricing_id: string | null;
}

/** Get the billing plan for an org, falling back to 'standard'. */
export async function getOrgBilling(orgId: string): Promise<OrgBilling | null> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("org_billing")
    .select("*")
    .eq("org_id", orgId)
    .single();
  if (error || !data) return null;
  return data as OrgBilling;
}

/** Get all billing plans. */
export async function getBillingPlans(): Promise<BillingPlan[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("billing_plans")
    .select("*")
    .eq("is_active", true)
    .order("seat_price_monthly_cents", { ascending: true });
  if (error || !data) return [];
  return data as BillingPlan[];
}

/** Count active seats for an org (member x module assignments). */
export async function countActiveSeats(orgId: string): Promise<number> {
  const sb = supabaseAdmin("platform");
  const { count, error } = await sb
    .from("organization_member_modules")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("enabled", true);
  if (error) return 0;
  return count ?? 0;
}

/** Get active custom pricing for an org, optionally scoped to a period. */
export async function getCustomPricing(orgId: string, periodMonth?: string): Promise<CustomPricing | null> {
  const sb = supabaseAdmin("platform");
  let query = sb
    .from("custom_pricing")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (periodMonth) {
    query = query.or(`period_month.eq.${periodMonth},period_month.is.null`);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;
  return data as unknown as CustomPricing;
}

/** Get effective pricing for an org by merging plan defaults with custom overrides. */
export async function getEffectivePricing(orgId: string, periodMonth?: string): Promise<EffectivePricing> {
  const sb = supabaseAdmin("platform");
  const billing = await getOrgBilling(orgId);
  const planId = billing?.plan_id ?? "standard";
  const { data: plan } = await sb
    .from("billing_plans")
    .select("*")
    .eq("id", planId)
    .single();

  const custom = await getCustomPricing(orgId, periodMonth);

  if (custom) {
    return {
      seat_price_monthly_cents: custom.seat_price_monthly_cents ?? plan?.seat_price_monthly_cents ?? 0,
      storage_price_gb_monthly_cents: custom.storage_price_gb_monthly_cents ?? plan?.storage_price_gb_monthly_cents ?? 0,
      platform_fee_monthly_cents: custom.platform_fee_monthly_cents ?? plan?.platform_fee_monthly_cents ?? 0,
      discount_percent: Number(custom.discount_percent) || 0,
      source: "custom",
      custom_pricing_id: custom.id,
    };
  }

  return {
    seat_price_monthly_cents: plan?.seat_price_monthly_cents ?? 0,
    storage_price_gb_monthly_cents: plan?.storage_price_gb_monthly_cents ?? 0,
    platform_fee_monthly_cents: plan?.platform_fee_monthly_cents ?? 0,
    discount_percent: 0,
    source: "plan",
    custom_pricing_id: null,
  };
}

/** Generate or update usage record for the current billing period. */
export async function recordUsage(orgId: string, periodMonth?: string): Promise<UsageRecord | null> {
  const sb = supabaseAdmin("platform");
  const period = periodMonth ?? new Date().toISOString().slice(0, 7);

  const pricing = await getEffectivePricing(orgId, period);
  const billing = await getOrgBilling(orgId);

  const seatCount = await countActiveSeats(orgId);
  const storageBytes = 0; // TODO: query R2/Supabase for actual storage

  const storageGb = Math.round((storageBytes / (1024 ** 3)) * 100) / 100;
  let seatCharge = seatCount * pricing.seat_price_monthly_cents;
  let storageCharge = Math.ceil(storageGb * pricing.storage_price_gb_monthly_cents);
  let platformFee = pricing.platform_fee_monthly_cents;
  let total = seatCharge + storageCharge + platformFee;

  // Apply discount percentage if set
  if (pricing.discount_percent > 0) {
    total = Math.round(total * (1 - pricing.discount_percent / 100));
  }

  const { data, error } = await sb
    .from("usage_records")
    .upsert(
      {
        org_id: orgId,
        period_month: period,
        seat_count: seatCount,
        storage_bytes: storageBytes,
        storage_gb: storageGb,
        seat_charge_cents: seatCharge,
        storage_charge_cents: storageCharge,
        platform_fee_cents: platformFee,
        total_charge_cents: total,
        pricing_snapshot: {
          plan_id: billing?.plan_id ?? "standard",
          seat_price: pricing.seat_price_monthly_cents,
          storage_price: pricing.storage_price_gb_monthly_cents,
          platform_fee: pricing.platform_fee_monthly_cents,
          discount_percent: pricing.discount_percent,
          source: pricing.source,
          custom_pricing_id: pricing.custom_pricing_id,
        },
      },
      { onConflict: "org_id,period_month" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("recordUsage error:", error.message);
    return null;
  }
  return data as UsageRecord;
}

/** Get usage records for an org. */
export async function getUsageRecords(orgId: string, limit = 12): Promise<UsageRecord[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("usage_records")
    .select("*")
    .eq("org_id", orgId)
    .order("period_month", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as UsageRecord[];
}

/** Generate an invoice from a usage record. */
export async function generateInvoice(
  orgId: string,
  periodMonth: string,
  actorUserId: string
): Promise<Invoice | null> {
  const sb = supabaseAdmin("platform");

  const { data: usage } = await sb
    .from("usage_records")
    .select("*")
    .eq("org_id", orgId)
    .eq("period_month", periodMonth)
    .single();
  if (!usage) return null;

  const lineItems = [
    {
      description: `Platform fee - ${periodMonth}`,
      quantity: 1,
      unit_price_cents: usage.platform_fee_cents,
      total_cents: usage.platform_fee_cents,
    },
    {
      description: `Seats (${usage.seat_count} active) - ${periodMonth}`,
      quantity: usage.seat_count,
      unit_price_cents: usage.seat_charge_cents / Math.max(usage.seat_count, 1),
      total_cents: usage.seat_charge_cents,
    },
    {
      description: `Storage (${usage.storage_gb} GB) - ${periodMonth}`,
      quantity: 1,
      unit_price_cents: usage.storage_charge_cents,
      total_cents: usage.storage_charge_cents,
    },
  ];

  const subtotal = usage.total_charge_cents;
  const taxCents = Math.round(subtotal * 0.15); // 15% VAT
  const total = subtotal + taxCents;

  const invoiceNumber = `INV-${periodMonth.replace("-", "")}-${orgId.slice(-6).toUpperCase()}`;

  const { data: invoice, error } = await sb
    .from("invoices")
    .insert({
      org_id: orgId,
      invoice_number: invoiceNumber,
      period_month: periodMonth,
      line_items: lineItems,
      subtotal_cents: subtotal,
      tax_cents: taxCents,
      total_cents: total,
      status: "draft",
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("generateInvoice error:", error.message);
    return null;
  }

  // Mark usage as invoiced
  await sb
    .from("usage_records")
    .update({ status: "invoiced" })
    .eq("org_id", orgId)
    .eq("period_month", periodMonth);

  // Apply any pending overrides for this period
  const { data: overrides } = await sb
    .from("billing_overrides")
    .select("*")
    .eq("org_id", orgId)
    .eq("applied_at", null)
    .or(`period_month.eq.${periodMonth},period_month.is.null`);

  if (overrides && overrides.length > 0) {
    for (const ov of overrides) {
      if (ov.override_type === "waive") {
        await sb
          .from("invoices")
          .update({ status: "written_off", notes: `Waived: ${ov.reason}` })
          .eq("id", invoice.id);
      } else {
        const newTotal = Math.max(0, total + ov.amount_cents);
        await sb
          .from("invoices")
          .update({ total_cents: newTotal, notes: ov.reason })
          .eq("id", invoice.id);
      }
      await sb
        .from("billing_overrides")
        .update({ applied_to_invoice: invoice.id, applied_at: new Date().toISOString() })
        .eq("id", ov.id);
    }
  }

  return invoice as unknown as Invoice;
}

/** Get invoices for an org. */
export async function getInvoices(orgId: string, limit = 12): Promise<Invoice[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("invoices")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Invoice[];
}

/** Get payments for an org. */
export async function getPayments(orgId: string, limit = 20): Promise<Payment[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("payments")
    .select("*")
    .eq("org_id", orgId)
    .order("paid_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Payment[];
}

/** Record a manual payment (EFT, cash, etc.). */
export async function recordPayment(
  orgId: string,
  invoiceId: string | null,
  amountCents: number,
  method: Payment["method"],
  bankReference: string | null,
  recordedBy: string,
  notes?: string
): Promise<Payment | null> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("payments")
    .insert({
      org_id: orgId,
      invoice_id: invoiceId,
      amount_cents: amountCents,
      method,
      bank_reference: bankReference,
      recorded_by: recordedBy,
      status: "completed",
      notes: notes ?? null,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("recordPayment error:", error.message);
    return null;
  }

  // If linked to invoice, check if fully paid
  if (invoiceId) {
    const { data: invoice } = await sb
      .from("invoices")
      .select("total_cents")
      .eq("id", invoiceId)
      .single();
    if (invoice) {
      const { data: payments } = await sb
        .from("payments")
        .select("amount_cents")
        .eq("invoice_id", invoiceId)
        .eq("status", "completed");
      const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
      if (totalPaid >= invoice.total_cents) {
        await sb
          .from("invoices")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", invoiceId);
      } else if (totalPaid > 0) {
        await sb
          .from("invoices")
          .update({ status: "partial" })
          .eq("id", invoiceId);
      }
    }
  }

  return data as unknown as Payment;
}

/** Create a billing override (admin only). */
export async function createOverride(
  orgId: string,
  periodMonth: string | null,
  overrideType: BillingOverride["override_type"],
  amountCents: number,
  reason: string,
  createdBy: string
): Promise<BillingOverride | null> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("billing_overrides")
    .insert({
      org_id: orgId,
      period_month: periodMonth,
      override_type: overrideType,
      amount_cents: amountCents,
      reason,
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (error) {
    console.error("createOverride error:", error.message);
    return null;
  }
  return data as unknown as BillingOverride;
}

/** Get overrides for an org. */
export async function getOverrides(orgId: string): Promise<BillingOverride[]> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("billing_overrides")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as BillingOverride[];
}

/** Set or update org billing configuration. */
export async function setOrgBilling(
  orgId: string,
  config: {
    plan_id?: string;
    billing_method?: "stripe" | "manual";
    billing_day?: number;
    billing_email?: string;
    tax_number?: string;
    admin_notes?: string;
  }
): Promise<OrgBilling | null> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("org_billing")
    .upsert(
      {
        org_id: orgId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" }
    )
    .select("*")
    .single();
  if (error) {
    console.error("setOrgBilling error:", error.message);
    return null;
  }
  return data as OrgBilling;
}

/** Get all orgs with billing info (admin view). */
export async function getAllOrgBilling(): Promise<Array<OrgBilling & { org_name: string }>> {
  const sb = supabaseAdmin("platform");
  const { data, error } = await sb
    .from("org_billing")
    .select(`
      *,
      organizations!inner(name)
    `)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    ...row,
    org_name: row.organizations?.name ?? "Unknown",
  }));
}

/** Format cents to currency string. */
export function formatCents(cents: number, currency = "ZAR"): string {
  const value = (cents / 100).toFixed(2);
  const symbol = currency === "ZAR" ? "R" : currency === "USD" ? "$" : "";
  return `${symbol}${value}`;
}

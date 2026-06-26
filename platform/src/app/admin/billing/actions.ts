"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function assertPlatformAdmin() {
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user || !user.publicMetadata?.platformAdmin) {
    throw new Error("Unauthorized: platform admin only");
  }
}

async function logAudit(sb: any, entry: { org_id: string; user_id: string; action_type: string; module_id: string; new_value?: any; old_value?: any }) {
  try {
    await sb.from("audit_log").insert(entry);
  } catch (e: any) {
    console.error("Audit log failed:", e?.message);
  }
}

export async function setOrgBillingAction(
  orgId: string,
  config: {
    plan_id?: string;
    billing_method?: "stripe" | "manual";
    billing_day?: number;
    billing_email?: string;
    tax_number?: string;
    admin_notes?: string;
  }
) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");
  const { error } = await sb
    .from("org_billing")
    .upsert(
      {
        org_id: orgId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" }
    );
  if (error) throw new Error(`Failed to update billing: ${error.message}`);

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  await logAudit(sb, {
    org_id: orgId,
    user_id: user?.id ?? "unknown",
    action_type: "billing_config_set",
    module_id: "billing",
    new_value: config as any,
  });

  revalidatePath("/admin/billing");
}

export async function recordPaymentAction(
  orgId: string,
  invoiceId: string | null,
  amountCents: number,
  method: "stripe" | "eft" | "cash" | "cheque" | "other",
  bankReference: string | null,
  notes: string | null,
  userId: string
) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");

  const { data: payment, error: payError } = await sb
    .from("payments")
    .insert({
      org_id: orgId,
      invoice_id: invoiceId,
      amount_cents: amountCents,
      method,
      bank_reference: bankReference,
      recorded_by: userId,
      status: "completed",
      notes,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (payError) throw new Error(`Failed to record payment: ${payError.message}`);

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
      const totalPaid = (payments ?? []).reduce(
        (sum: number, p: any) => sum + p.amount_cents,
        0
      );
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

  await logAudit(sb, {
    org_id: orgId,
    user_id: userId,
    action_type: "payment_recorded",
    module_id: "billing",
    new_value: { amount_cents: amountCents, method, invoice_id: invoiceId },
  });

  revalidatePath("/admin/billing");
  return payment;
}

export async function createOverrideAction(
  orgId: string,
  periodMonth: string | null,
  overrideType: "discount" | "surcharge" | "fixed_amount" | "credit" | "waive",
  amountCents: number,
  reason: string,
  userId: string
) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");
  const { error } = await sb.from("billing_overrides").insert({
    org_id: orgId,
    period_month: periodMonth,
    override_type: overrideType,
    amount_cents: amountCents,
    reason,
    created_by: userId,
  });
  if (error) throw new Error(`Failed to create override: ${error.message}`);

  await logAudit(sb, {
    org_id: orgId,
    user_id: userId,
    action_type: "override_created",
    module_id: "billing",
    new_value: { override_type: overrideType, amount_cents: amountCents, reason, period_month: periodMonth },
  });

  revalidatePath("/admin/billing");
}

export async function generateInvoiceAction(
  orgId: string,
  periodMonth: string,
  userId: string
) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");

  const { data: usage } = await sb
    .from("usage_records")
    .select("*")
    .eq("org_id", orgId)
    .eq("period_month", periodMonth)
    .single();
  if (!usage) throw new Error("No usage record found for this period");

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
      unit_price_cents: usage.seat_count > 0 ? usage.seat_charge_cents / usage.seat_count : 0,
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
  const taxCents = Math.round(subtotal * 0.15);
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
  if (error) throw new Error(`Failed to generate invoice: ${error.message}`);

  await sb
    .from("usage_records")
    .update({ status: "invoiced" })
    .eq("org_id", orgId)
    .eq("period_month", periodMonth);

  // Apply pending overrides
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

  await logAudit(sb, {
    org_id: orgId,
    user_id: userId,
    action_type: "invoice_generated",
    module_id: "billing",
    new_value: { invoice_id: invoice.id, invoice_number: invoice.invoice_number, period_month: periodMonth, total_cents: total },
  });

  revalidatePath("/admin/billing");
  return invoice;
}

export async function meterUsageAction(orgId: string) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");
  const period = new Date().toISOString().slice(0, 7);

  // Get org billing config
  const { data: billing } = await sb
    .from("org_billing")
    .select("plan_id")
    .eq("org_id", orgId)
    .single();
  const planId = billing?.plan_id ?? "standard";

  // Get plan defaults
  const { data: plan } = await sb
    .from("billing_plans")
    .select("*")
    .eq("id", planId)
    .single();

  // Check for custom pricing override
  const { data: custom } = await sb
    .from("custom_pricing")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`period_month.eq.${period},period_month.is.null`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const seatPrice = custom?.seat_price_monthly_cents ?? plan?.seat_price_monthly_cents ?? 0;
  const storagePrice = custom?.storage_price_gb_monthly_cents ?? plan?.storage_price_gb_monthly_cents ?? 0;
  const platformFee = custom?.platform_fee_monthly_cents ?? plan?.platform_fee_monthly_cents ?? 0;
  const discountPercent = Number(custom?.discount_percent) || 0;

  const { count: seatCount } = await sb
    .from("organization_member_modules")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("enabled", true);

  const seats = seatCount ?? 0;
  const storageBytes = 0;
  const storageGb = Math.round((storageBytes / (1024 ** 3)) * 100) / 100;
  let seatCharge = seats * seatPrice;
  let storageCharge = Math.ceil(storageGb * storagePrice);
  let total = seatCharge + storageCharge + platformFee;

  if (discountPercent > 0) {
    total = Math.round(total * (1 - discountPercent / 100));
  }

  const { error } = await sb
    .from("usage_records")
    .upsert(
      {
        org_id: orgId,
        period_month: period,
        seat_count: seats,
        storage_bytes: storageBytes,
        storage_gb: storageGb,
        seat_charge_cents: seatCharge,
        storage_charge_cents: storageCharge,
        platform_fee_cents: platformFee,
        total_charge_cents: total,
        pricing_snapshot: {
          plan_id: planId,
          seat_price: seatPrice,
          storage_price: storagePrice,
          platform_fee: platformFee,
          discount_percent: discountPercent,
          source: custom ? "custom" : "plan",
          custom_pricing_id: custom?.id ?? null,
        },
      },
      { onConflict: "org_id,period_month" }
    );
  if (error) throw new Error(`Failed to meter usage: ${error.message}`);

  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  await logAudit(sb, {
    org_id: orgId,
    user_id: user?.id ?? "unknown",
    action_type: "usage_metered",
    module_id: "billing",
    new_value: { period, seats, total_charge_cents: total },
  });

  revalidatePath("/admin/billing");
}

export async function setCustomPricingAction(
  orgId: string,
  config: {
    period_month?: string | null;
    seat_price_monthly_cents?: number | null;
    storage_price_gb_monthly_cents?: number | null;
    platform_fee_monthly_cents?: number | null;
    discount_percent?: number;
    reason?: string;
  },
  userId: string
) {
  await assertPlatformAdmin();
  const sb = supabaseAdmin("platform");

  // Deactivate existing custom pricing for this org/period
  await sb
    .from("custom_pricing")
    .update({ is_active: false })
    .eq("org_id", orgId)
    .eq("is_active", true);

  const { error } = await sb.from("custom_pricing").insert({
    org_id: orgId,
    period_month: config.period_month ?? null,
    seat_price_monthly_cents: config.seat_price_monthly_cents ?? null,
    storage_price_gb_monthly_cents: config.storage_price_gb_monthly_cents ?? null,
    platform_fee_monthly_cents: config.platform_fee_monthly_cents ?? null,
    discount_percent: config.discount_percent ?? 0,
    reason: config.reason ?? null,
    set_by: userId,
    is_active: true,
  });
  if (error) throw new Error(`Failed to set custom pricing: ${error.message}`);

  await logAudit(sb, {
    org_id: orgId,
    user_id: userId,
    action_type: "custom_pricing_set",
    module_id: "billing",
    new_value: config as any,
  });

  revalidatePath("/admin/billing");
}

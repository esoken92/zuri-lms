-- Billing schema
-- Metered usage tracking, invoices, payments (Stripe + manual EFT), and billing overrides.
-- All amounts stored in cents (ZAR) to avoid floating-point issues.

-- Ensure schema exists (self-contained migration)
CREATE SCHEMA IF NOT EXISTS platform;

-- Ensure set_updated_at function exists (defined in core schema, but guard here)
CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Pricing plans ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform.billing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  -- Price per active seat (member x module assignment) per month in cents
  seat_price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  -- Price per GB-month storage in cents
  storage_price_gb_monthly_cents INTEGER NOT NULL DEFAULT 0,
  -- Flat platform fee per month in cents
  platform_fee_monthly_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Org billing configuration ──────────────────────────────────
CREATE TABLE IF NOT EXISTS platform.org_billing (
  org_id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES platform.billing_plans(id),
  -- Stripe customer ID (nullable for manual/EFT-only orgs)
  stripe_customer_id TEXT,
  -- Stripe subscription ID (nullable for manual billing)
  stripe_subscription_id TEXT,
  -- Billing method: 'stripe' | 'manual' (EFT/cash/etc.)
  billing_method TEXT NOT NULL DEFAULT 'stripe',
  -- Billing cycle day of month (1-28)
  billing_day INTEGER NOT NULL DEFAULT 1,
  -- Currency override (defaults to plan currency)
  currency TEXT NOT NULL DEFAULT 'ZAR',
  -- Billing email
  billing_email TEXT,
  -- Tax/VAT number
  tax_number TEXT,
  -- Notes for admin
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Usage metering (monthly aggregates) ────────────────────────
CREATE TABLE IF NOT EXISTS platform.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  -- Billing period (format: YYYY-MM)
  period_month TEXT NOT NULL,
  -- Number of active seats (member x module assignments)
  seat_count INTEGER NOT NULL DEFAULT 0,
  -- Storage used in bytes
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  -- Storage in GB (computed for convenience)
  storage_gb NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Computed charges in cents
  seat_charge_cents INTEGER NOT NULL DEFAULT 0,
  storage_charge_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  total_charge_cents INTEGER NOT NULL DEFAULT 0,
  -- Status: 'pending' | 'invoiced' | 'paid' | 'overridden'
  status TEXT NOT NULL DEFAULT 'pending',
  -- Snapshot of pricing used
  pricing_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, period_month)
);

-- ── Invoices ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  -- Billing period
  period_month TEXT NOT NULL,
  -- Line items as JSONB array
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Totals in cents
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  -- Status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'written_off'
  status TEXT NOT NULL DEFAULT 'draft',
  -- Stripe invoice ID (if generated via Stripe)
  stripe_invoice_id TEXT,
  -- Due date
  due_date TIMESTAMPTZ,
  -- When invoice was sent/issued
  issued_at TIMESTAMPTZ,
  -- When invoice was fully paid
  paid_at TIMESTAMPTZ,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Payments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  invoice_id UUID REFERENCES platform.invoices(id) ON DELETE SET NULL,
  -- Amount in cents
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  -- Payment method: 'stripe' | 'eft' | 'cash' | 'cheque' | 'other'
  method TEXT NOT NULL,
  -- Stripe payment intent / charge ID
  stripe_payment_id TEXT,
  -- For EFT: bank reference, deposit slip, etc.
  bank_reference TEXT,
  -- Who recorded this payment (Clerk user ID)
  recorded_by TEXT,
  -- Status: 'pending' | 'completed' | 'failed' | 'refunded'
  status TEXT NOT NULL DEFAULT 'completed',
  -- Proof of payment file URL (R2 key)
  proof_file_key TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Custom per-org pricing overrides ─────────────────────────
-- Allows admin to override any individual pricing field per org without
-- changing the plan. NULL = use plan default. Applies to all future periods
-- unless scoped via period_month.
CREATE TABLE IF NOT EXISTS platform.custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  -- Scope: NULL = all future periods, or specific YYYY-MM
  period_month TEXT,
  -- Override individual fields (NULL = inherit from plan)
  seat_price_monthly_cents INTEGER,
  storage_price_gb_monthly_cents INTEGER,
  platform_fee_monthly_cents INTEGER,
  -- Discount percentage applied to total (0-100)
  discount_percent NUMERIC(5,2) DEFAULT 0,
  -- Reason for custom pricing
  reason TEXT,
  -- Who set this (Clerk user ID)
  set_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Billing overrides (admin manual adjustments) ──────────────
CREATE TABLE IF NOT EXISTS platform.billing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  -- Period this override applies to (YYYY-MM), or NULL for all future periods
  period_month TEXT,
  -- Override type: 'discount' | 'surcharge' | 'fixed_amount' | 'credit' | 'waive'
  override_type TEXT NOT NULL,
  -- Amount in cents (positive for charge, negative for credit/discount)
  amount_cents INTEGER NOT NULL,
  -- Reason / description
  reason TEXT NOT NULL,
  -- Who created the override (Clerk user ID)
  created_by TEXT,
  -- Whether this override has been applied to an invoice
  applied_to_invoice UUID REFERENCES platform.invoices(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usage_org_period ON platform.usage_records(org_id, period_month);
CREATE INDEX IF NOT EXISTS idx_usage_status ON platform.usage_records(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON platform.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON platform.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON platform.invoices(period_month);
CREATE INDEX IF NOT EXISTS idx_payments_org ON platform.payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON platform.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_overrides_org ON platform.billing_overrides(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_pricing_org ON platform.custom_pricing(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_pricing_active ON platform.custom_pricing(org_id, is_active);

-- ── Triggers ───────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_org_billing_updated_at ON platform.org_billing;
CREATE TRIGGER trg_org_billing_updated_at
  BEFORE UPDATE ON platform.org_billing
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

DROP TRIGGER IF EXISTS trg_usage_records_updated_at ON platform.usage_records;
CREATE TRIGGER trg_usage_records_updated_at
  BEFORE UPDATE ON platform.usage_records
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON platform.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON platform.invoices
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- ── Seed default plan ──────────────────────────────────────────
INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES (
  'standard',
  'Standard',
  'Per-seat metered billing with storage add-on',
  9900,   -- R99/seat/month
  1250,   -- R12.50/GB-month
  29900   -- R299/month platform fee
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES (
  'enterprise',
  'Enterprise',
  'Volume pricing with custom terms',
  6900,   -- R69/seat/month
  1180,   -- R11.80/GB-month
  149900  -- R1499/month platform fee
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES (
  'manual',
  'Manual / EFT',
  'Manual billing with EFT payment tracking',
  9900,   -- R99/seat/month
  1250,   -- R12.50/GB-month
  29900   -- R299/month platform fee
)
ON CONFLICT (id) DO NOTHING;

-- ── Comments ───────────────────────────────────────────────────
COMMENT ON TABLE platform.billing_plans IS 'Pricing plans for metered billing';
COMMENT ON TABLE platform.org_billing IS 'Per-org billing configuration (Stripe or manual)';
COMMENT ON TABLE platform.usage_records IS 'Monthly usage aggregates per org for metered billing';
COMMENT ON TABLE platform.invoices IS 'Invoices with line items, supports Stripe and manual';
COMMENT ON TABLE platform.payments IS 'Payments record (Stripe charges and manual EFT/cash)';
COMMENT ON TABLE platform.billing_overrides IS 'Admin manual adjustments: discounts, credits, waivers';
COMMENT ON TABLE platform.custom_pricing IS 'Per-org custom pricing overrides for any individual field';

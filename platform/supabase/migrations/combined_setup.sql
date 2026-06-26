-- ============================================================
-- RUN THIS ENTIRE FILE IN ONE GO IN SUPABASE SQL EDITOR
-- It drops the old broken platform schema and recreates everything
-- ============================================================

DROP SCHEMA IF EXISTS platform CASCADE;
CREATE SCHEMA platform;

-- ── set_updated_at function ────────────────────────────────────
CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ── Helper function to check if user is org member ───────────────
-- Uses platform.organization_members table which is synced from Clerk
CREATE OR REPLACE FUNCTION platform.is_org_member(org_id TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform.organization_members
    WHERE organization_id = org_id
    AND user_id = user_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ── Helper function to check if user is platform admin ───────────
-- Checks if user has platformAdmin flag in Clerk metadata via auth.users
CREATE OR REPLACE FUNCTION platform.is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'platformAdmin' = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ── organizations ──────────────────────────────────────────────
CREATE TABLE platform.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── organization_members ─────────────────────────────────────
-- Mirrors Clerk organization membership for RLS purposes
CREATE TABLE platform.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ── sites ──────────────────────────────────────────────────────
CREATE TABLE platform.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── organization_modules ───────────────────────────────────────
CREATE TABLE platform.organization_modules (
  org_id TEXT NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, module_id)
);

-- ── billing_plans ──────────────────────────────────────────────
CREATE TABLE platform.billing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  seat_price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  storage_price_gb_monthly_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_monthly_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── org_billing ────────────────────────────────────────────────
CREATE TABLE platform.org_billing (
  org_id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES platform.billing_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_method TEXT NOT NULL DEFAULT 'stripe',
  billing_day INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  billing_email TEXT,
  tax_number TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── usage_records ──────────────────────────────────────────────
CREATE TABLE platform.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  seat_count INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  storage_gb NUMERIC(12,2) NOT NULL DEFAULT 0,
  seat_charge_cents INTEGER NOT NULL DEFAULT 0,
  storage_charge_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  total_charge_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  pricing_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, period_month)
);

-- ── invoices ───────────────────────────────────────────────────
CREATE TABLE platform.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  period_month TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  stripe_invoice_id TEXT,
  due_date TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── payments ───────────────────────────────────────────────────
CREATE TABLE platform.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  invoice_id UUID REFERENCES platform.invoices(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  method TEXT NOT NULL,
  stripe_payment_id TEXT,
  bank_reference TEXT,
  recorded_by TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  proof_file_key TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── custom_pricing ─────────────────────────────────────────────
CREATE TABLE platform.custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  period_month TEXT,
  seat_price_monthly_cents INTEGER,
  storage_price_gb_monthly_cents INTEGER,
  platform_fee_monthly_cents INTEGER,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  reason TEXT,
  set_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── billing_overrides ──────────────────────────────────────────
CREATE TABLE platform.billing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  period_month TEXT,
  override_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT,
  applied_to_invoice UUID REFERENCES platform.invoices(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_log ─────────────────────────────────────────────────
CREATE TABLE platform.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  module_id TEXT NOT NULL,
  target_user_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ── organization_member_modules ────────────────────────────────
CREATE TABLE platform.organization_member_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id, module_id)
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX idx_org_members_org ON platform.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON platform.organization_members(user_id);
CREATE INDEX idx_sites_org ON platform.sites(org_id);
CREATE INDEX idx_organization_modules_org ON platform.organization_modules(org_id);
CREATE INDEX idx_organization_modules_enabled ON platform.organization_modules(org_id, enabled);
CREATE INDEX idx_usage_org_period ON platform.usage_records(org_id, period_month);
CREATE INDEX idx_usage_status ON platform.usage_records(status);
CREATE INDEX idx_invoices_org ON platform.invoices(org_id);
CREATE INDEX idx_invoices_status ON platform.invoices(status);
CREATE INDEX idx_invoices_period ON platform.invoices(period_month);
CREATE INDEX idx_payments_org ON platform.payments(org_id);
CREATE INDEX idx_payments_invoice ON platform.payments(invoice_id);
CREATE INDEX idx_overrides_org ON platform.billing_overrides(org_id);
CREATE INDEX idx_custom_pricing_org ON platform.custom_pricing(org_id);
CREATE INDEX idx_custom_pricing_active ON platform.custom_pricing(org_id, is_active);
CREATE INDEX idx_audit_log_org ON platform.audit_log(org_id);
CREATE INDEX idx_audit_log_user ON platform.audit_log(user_id);
CREATE INDEX idx_audit_log_created ON platform.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_module ON platform.audit_log(module_id);
CREATE INDEX idx_audit_log_target_user ON platform.audit_log(target_user_id);
CREATE INDEX idx_org_member_modules_org ON platform.organization_member_modules(org_id);
CREATE INDEX idx_org_member_modules_user ON platform.organization_member_modules(user_id);
CREATE INDEX idx_org_member_modules_module ON platform.organization_member_modules(module_id);

-- ── Triggers ───────────────────────────────────────────────────
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON platform.organizations
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_organization_members_updated_at
  BEFORE UPDATE ON platform.organization_members
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON platform.sites
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_organization_modules_updated_at
  BEFORE UPDATE ON platform.organization_modules
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_org_billing_updated_at
  BEFORE UPDATE ON platform.org_billing
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_usage_records_updated_at
  BEFORE UPDATE ON platform.usage_records
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON platform.invoices
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

CREATE TRIGGER trg_org_member_modules_updated_at
  BEFORE UPDATE ON platform.organization_member_modules
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- ── RLS Policies for Multi-Tenant Isolation ──────────────────────
-- Enable RLS on all platform tables
ALTER TABLE platform.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.organization_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.org_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.custom_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.billing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.organization_member_modules ENABLE ROW LEVEL SECURITY;

-- Organizations: Platform admins can read all, org members can read their own org
CREATE POLICY "Platform admins can read organizations"
  ON platform.organizations FOR SELECT
  USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY "Org members can read their own organization"
  ON platform.organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM platform.organization_members WHERE user_id = auth.uid()));

-- Organization members: Users can read their own memberships, platform admins can manage all
CREATE POLICY "Users can read their own org memberships"
  ON platform.organization_members FOR SELECT
  USING (user_id = auth.uid() OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Service role can manage org memberships"
  ON platform.organization_members FOR ALL
  USING (true);  -- App-level auth handles platform admin check via Clerk

-- Sites: Org members can read/write their own org's sites, platform admins can manage all
CREATE POLICY "Org members can read their org sites"
  ON platform.sites FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all sites"
  ON platform.sites FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Organization modules: Org members can read their own org's modules, platform admins can manage all
CREATE POLICY "Org members can read their org modules"
  ON platform.organization_modules FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all org modules"
  ON platform.organization_modules FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Billing plans: Everyone can read, only platform admins can write
CREATE POLICY "Everyone can read billing plans"
  ON platform.billing_plans FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage billing plans"
  ON platform.billing_plans FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Org billing: Org members can read their own org's billing, platform admins can manage all
CREATE POLICY "Org members can read their org billing"
  ON platform.org_billing FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all org billing"
  ON platform.org_billing FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Usage records: Org members can read their own org's usage, platform admins can manage all
CREATE POLICY "Org members can read their org usage records"
  ON platform.usage_records FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all usage records"
  ON platform.usage_records FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Invoices: Org members can read their own org's invoices, platform admins can manage all
CREATE POLICY "Org members can read their org invoices"
  ON platform.invoices FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all invoices"
  ON platform.invoices FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Payments: Org members can read their own org's payments, platform admins can manage all
CREATE POLICY "Org members can read their org payments"
  ON platform.payments FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all payments"
  ON platform.payments FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Custom pricing: Org members can read their own org's custom pricing, platform admins can manage all
CREATE POLICY "Org members can read their org custom pricing"
  ON platform.custom_pricing FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all custom pricing"
  ON platform.custom_pricing FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Billing overrides: Org members can read their own org's overrides, platform admins can manage all
CREATE POLICY "Org members can read their org billing overrides"
  ON platform.billing_overrides FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all billing overrides"
  ON platform.billing_overrides FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- Audit log: Org members can read their own org's audit logs, platform admins can read all
CREATE POLICY "Org members can read their org audit logs"
  ON platform.audit_log FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can read all audit logs"
  ON platform.audit_log FOR SELECT
  USING (platform.is_platform_admin(auth.uid()));

-- Organization member modules: Org members can read their own org's member modules, platform admins can manage all
CREATE POLICY "Org members can read their org member modules"
  ON platform.organization_member_modules FOR SELECT
  USING (platform.is_org_member(org_id, auth.uid()) OR platform.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all member modules"
  ON platform.organization_member_modules FOR ALL
  USING (platform.is_platform_admin(auth.uid()));

-- ── Seed plans ─────────────────────────────────────────────────
INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES ('standard', 'Standard', 'Per-seat metered billing with storage add-on', 9900, 1250, 29900);

INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES ('enterprise', 'Enterprise', 'Volume pricing with custom terms', 6900, 1180, 149900);

INSERT INTO platform.billing_plans (id, name, description, seat_price_monthly_cents, storage_price_gb_monthly_cents, platform_fee_monthly_cents)
VALUES ('manual', 'Manual / EFT', 'Manual billing with EFT payment tracking', 9900, 1250, 29900);

-- ── Comments ───────────────────────────────────────────────────
COMMENT ON TABLE platform.organizations IS 'Clerk organizations mirrored in the platform schema';
COMMENT ON TABLE platform.organization_members IS 'Clerk organization membership mirrored for RLS purposes';
COMMENT ON TABLE platform.sites IS 'Physical sites/locations belonging to an organization';
COMMENT ON TABLE platform.organization_modules IS 'Modules enabled for each organization';
COMMENT ON TABLE platform.billing_plans IS 'Pricing plans for metered billing';
COMMENT ON TABLE platform.org_billing IS 'Per-org billing configuration (Stripe or manual)';
COMMENT ON TABLE platform.usage_records IS 'Monthly usage aggregates per org for metered billing';
COMMENT ON TABLE platform.invoices IS 'Invoices with line items, supports Stripe and manual';
COMMENT ON TABLE platform.payments IS 'Payments record (Stripe charges and manual EFT/cash)';
COMMENT ON TABLE platform.billing_overrides IS 'Admin manual adjustments: discounts, credits, waivers';
COMMENT ON TABLE platform.custom_pricing IS 'Per-org custom pricing overrides for any individual field';
COMMENT ON TABLE platform.audit_log IS 'Audit log for platform configuration changes';
COMMENT ON TABLE platform.organization_member_modules IS 'Member-level module assignments within an organization';

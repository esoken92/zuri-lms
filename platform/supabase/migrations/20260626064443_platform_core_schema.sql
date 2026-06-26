-- Platform core schema
-- Defines the foundational tables for the Zuri platform: organizations, sites, and organization_modules.
-- This must be applied before module-specific and audit-log migrations.

CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE IF NOT EXISTS platform.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform.organization_modules (
  org_id TEXT NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, module_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_sites_org ON platform.sites(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_org ON platform.organization_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_enabled ON platform.organization_modules(org_id, enabled);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON platform.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON platform.organizations
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

DROP TRIGGER IF EXISTS trg_sites_updated_at ON platform.sites;
CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON platform.sites
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

DROP TRIGGER IF EXISTS trg_organization_modules_updated_at ON platform.organization_modules;
CREATE TRIGGER trg_organization_modules_updated_at
  BEFORE UPDATE ON platform.organization_modules
  FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

COMMENT ON TABLE platform.organizations IS 'Clerk organizations mirrored in the platform schema';
COMMENT ON TABLE platform.sites IS 'Physical sites/locations belonging to an organization';
COMMENT ON TABLE platform.organization_modules IS 'Modules enabled for each organization';

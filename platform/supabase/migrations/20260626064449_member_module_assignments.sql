-- Member-level module assignments
-- Allows org admins to grant/revoke module access to individual members
-- This sits on top of org-level module enablement
-- Note: Permission checks are done at application level via Clerk API, not RLS

CREATE TABLE IF NOT EXISTS platform.organization_member_modules (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_member_modules_org ON platform.organization_member_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_org_member_modules_user ON platform.organization_member_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_org_member_modules_module ON platform.organization_member_modules(module_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION platform.update_org_member_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_member_modules_updated_at
  BEFORE UPDATE ON platform.organization_member_modules
  FOR EACH ROW
  EXECUTE FUNCTION platform.update_org_member_modules_updated_at();

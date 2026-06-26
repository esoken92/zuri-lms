-- Platform audit log
-- Tracks all configuration changes for accountability and debugging
-- Records who changed what, when, and the before/after state

CREATE TABLE IF NOT EXISTS platform.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'org_module_enable', 'org_module_disable', 'member_module_grant', 'member_module_revoke'
  module_id TEXT NOT NULL,
  target_user_id TEXT, -- For member-level changes, the user being affected
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON platform.audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON platform.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON platform.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_module ON platform.audit_log(module_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user ON platform.audit_log(target_user_id);

-- Comment
COMMENT ON TABLE platform.audit_log IS 'Audit log for platform configuration changes';
COMMENT ON COLUMN platform.audit_log.action_type IS 'Type of action: org_module_enable, org_module_disable, member_module_grant, member_module_revoke';
COMMENT ON COLUMN platform.audit_log.target_user_id IS 'For member-level changes, the user whose access is being modified';

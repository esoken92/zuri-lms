-- Gate Pass Module Schema
-- Schema: gatepass
-- Visitor and vehicle gate pass management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gatepass schema
CREATE SCHEMA IF NOT EXISTS gatepass;

-- ============================================
-- Gate Passes
-- ============================================
CREATE TABLE gatepass.gate_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_company TEXT,
  visitor_phone TEXT,
  visitor_email TEXT,
  visitor_id_number TEXT,
  visit_purpose TEXT NOT NULL,
  visit_type TEXT NOT NULL, -- 'visitor', 'contractor', 'delivery', 'employee'
  host_name TEXT NOT NULL,
  host_department TEXT,
  host_contact TEXT,
  vehicle_registration TEXT,
  vehicle_type TEXT, -- 'car', 'truck', 'van', 'motorcycle', 'bicycle'
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  pass_type TEXT NOT NULL, -- 'single_entry', 'multi_entry', 'permanent'
  expected_arrival TIMESTAMP WITH TIME ZONE,
  expected_departure TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  actual_departure TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active', 'completed', 'expired', 'cancelled'
  issued_by UUID NOT NULL, -- Clerk user ID
  approved_by UUID, -- Clerk user ID
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  documents TEXT[], -- R2 object keys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gate_passes
CREATE INDEX idx_gate_passes_org_id ON gatepass.gate_passes(org_id);
CREATE INDEX idx_gate_passes_status ON gatepass.gate_passes(status);
CREATE INDEX idx_gate_passes_expected_arrival ON gatepass.gate_passes(expected_arrival);
CREATE INDEX idx_gate_passes_visitor_name ON gatepass.gate_passes(visitor_name);
CREATE INDEX idx_gate_passes_vehicle_registration ON gatepass.gate_passes(vehicle_registration);

-- ============================================
-- Gate Logs
-- ============================================
CREATE TABLE gatepass.gate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  gate_pass_id UUID REFERENCES gatepass.gate_passes(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL, -- 'entry', 'exit', 'issue', 'return', 'rejection'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gate_name TEXT,
  guard_name TEXT,
  guard_id UUID, -- Clerk user ID
  vehicle_registration TEXT,
  visitor_name TEXT,
  notes TEXT,
  images TEXT[], -- R2 object keys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gate_logs
CREATE INDEX idx_gate_logs_org_id ON gatepass.gate_logs(org_id);
CREATE INDEX idx_gate_logs_gate_pass_id ON gatepass.gate_logs(gate_pass_id);
CREATE INDEX idx_gate_logs_timestamp ON gatepass.gate_logs(timestamp DESC);
CREATE INDEX idx_gate_logs_log_type ON gatepass.gate_logs(log_type);

-- ============================================
-- Pre-Approved Visitors
-- ============================================
CREATE TABLE gatepass.pre_approved_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_company TEXT,
  visitor_phone TEXT,
  visitor_email TEXT,
  visitor_id_number TEXT,
  visitor_photo TEXT, -- R2 object key
  visit_purpose TEXT,
  host_name TEXT,
  host_department TEXT,
  vehicle_registration TEXT,
  vehicle_type TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
  notes TEXT,
  created_by UUID NOT NULL, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pre_approved_visitors
CREATE INDEX idx_pre_approved_visitors_org_id ON gatepass.pre_approved_visitors(org_id);
CREATE INDEX idx_pre_approved_visitors_status ON gatepass.pre_approved_visitors(status);
CREATE INDEX idx_pre_approved_visitors_valid_until ON gatepass.pre_approved_visitors(valid_until);
CREATE INDEX idx_pre_approved_visitors_visitor_phone ON gatepass.pre_approved_visitors(visitor_phone);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Helper function to check if user is org member
CREATE OR REPLACE FUNCTION gatepass.is_org_member(org_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform.organization_members
    WHERE organization_id = org_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION gatepass.is_platform_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform.organization_members om
    JOIN clerk.organizations o ON o.id = om.organization_id
    WHERE om.user_id = user_uuid
    AND o.public_metadata->>'platformAdmin' = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RLS: gate_passes
ALTER TABLE gatepass.gate_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read gate_passes in their org"
  ON gatepass.gate_passes FOR SELECT
  USING (gatepass.is_org_member(org_id, auth.uid()) OR gatepass.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert gate_passes in their org"
  ON gatepass.gate_passes FOR INSERT
  WITH CHECK (gatepass.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update gate_passes in their org"
  ON gatepass.gate_passes FOR UPDATE
  USING (gatepass.is_org_member(org_id, auth.uid()) OR gatepass.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete gate_passes"
  ON gatepass.gate_passes FOR DELETE
  USING (gatepass.is_platform_admin(auth.uid()));

-- RLS: gate_logs
ALTER TABLE gatepass.gate_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read gate_logs in their org"
  ON gatepass.gate_logs FOR SELECT
  USING (gatepass.is_org_member(org_id, auth.uid()) OR gatepass.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert gate_logs in their org"
  ON gatepass.gate_logs FOR INSERT
  WITH CHECK (gatepass.is_org_member(org_id, auth.uid()));

-- No update/delete for gate_logs (immutable)

-- RLS: pre_approved_visitors
ALTER TABLE gatepass.pre_approved_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read pre_approved_visitors in their org"
  ON gatepass.pre_approved_visitors FOR SELECT
  USING (gatepass.is_org_member(org_id, auth.uid()) OR gatepass.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert pre_approved_visitors in their org"
  ON gatepass.pre_approved_visitors FOR INSERT
  WITH CHECK (gatepass.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update pre_approved_visitors in their org"
  ON gatepass.pre_approved_visitors FOR UPDATE
  USING (gatepass.is_org_member(org_id, auth.uid()) OR gatepass.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete pre_approved_visitors"
  ON gatepass.pre_approved_visitors FOR DELETE
  USING (gatepass.is_platform_admin(auth.uid()));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION gatepass.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER gate_passes_updated_at
  BEFORE UPDATE ON gatepass.gate_passes
  FOR EACH ROW EXECUTE FUNCTION gatepass.set_updated_at();

CREATE TRIGGER pre_approved_visitors_updated_at
  BEFORE UPDATE ON gatepass.pre_approved_visitors
  FOR EACH ROW EXECUTE FUNCTION gatepass.set_updated_at();

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA gatepass TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA gatepass TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gatepass TO authenticated;

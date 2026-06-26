-- Access Management Module Schema
-- Schema: access
-- Physical access control, zones, and permissions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create access schema
CREATE SCHEMA IF NOT EXISTS access;

-- ============================================
-- Access Zones
-- ============================================
CREATE TABLE access.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_code TEXT UNIQUE NOT NULL,
  zone_type TEXT NOT NULL, -- 'building', 'floor', 'room', 'area', 'gate'
  parent_zone_id UUID REFERENCES access.zones(id) ON DELETE SET NULL,
  description TEXT,
  access_level TEXT DEFAULT 'restricted', -- 'public', 'restricted', 'confidential', 'secure'
  capacity INTEGER,
  requires_badge BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for zones
CREATE INDEX idx_zones_org_id ON access.zones(org_id);
CREATE INDEX idx_zones_zone_code ON access.zones(zone_code);
CREATE INDEX idx_zones_parent_zone_id ON access.zones(parent_zone_id);
CREATE INDEX idx_zones_status ON access.zones(status);

-- ============================================
-- Access Cards/Badges
-- ============================================
CREATE TABLE access.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  badge_number TEXT UNIQUE NOT NULL,
  badge_type TEXT NOT NULL, -- 'card', 'fob', 'biometric', 'mobile'
  holder_name TEXT NOT NULL,
  holder_id UUID, -- Clerk user ID (if user exists)
  holder_company TEXT,
  holder_department TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'lost', 'stolen', 'expired', 'revoked'
  access_zones TEXT[], -- Array of zone IDs the badge can access
  photo TEXT, -- R2 object key
  issued_by UUID NOT NULL, -- Clerk user ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for badges
CREATE INDEX idx_badges_org_id ON access.badges(org_id);
CREATE INDEX idx_badges_badge_number ON access.badges(badge_number);
CREATE INDEX idx_badges_holder_id ON access.badges(holder_id);
CREATE INDEX idx_badges_status ON access.badges(status);
CREATE INDEX idx_badges_expiry_date ON access.badges(expiry_date);

-- ============================================
-- Access Requests
-- ============================================
CREATE TABLE access.access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL, -- Clerk user ID
  requester_name TEXT NOT NULL,
  requester_company TEXT,
  requester_department TEXT,
  requested_zones TEXT[] NOT NULL, -- Array of zone IDs
  access_type TEXT NOT NULL, -- 'permanent', 'temporary', 'one_time'
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  approved_by UUID, -- Clerk user ID
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for access_requests
CREATE INDEX idx_access_requests_org_id ON access.access_requests(org_id);
CREATE INDEX idx_access_requests_requester_id ON access.access_requests(requester_id);
CREATE INDEX idx_access_requests_status ON access.access_requests(status);
CREATE INDEX idx_access_requests_start_date ON access.access_requests(start_date);

-- ============================================
-- Access Logs
-- ============================================
CREATE TABLE access.access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES access.badges(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES access.zones(id) ON DELETE SET NULL,
  user_id UUID, -- Clerk user ID (if user exists)
  access_type TEXT NOT NULL, -- 'entry', 'exit', 'denied', 'attempt'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reader_location TEXT,
  result TEXT NOT NULL, -- 'granted', 'denied', 'error'
  denial_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for access_logs
CREATE INDEX idx_access_logs_org_id ON access.access_logs(org_id);
CREATE INDEX idx_access_logs_badge_id ON access.access_logs(badge_id);
CREATE INDEX idx_access_logs_zone_id ON access.access_logs(zone_id);
CREATE INDEX idx_access_logs_user_id ON access.access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON access.access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_result ON access.access_logs(result);

-- ============================================
-- Access Schedules
-- ============================================
CREATE TABLE access.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES access.badges(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES access.zones(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for schedules
CREATE INDEX idx_schedules_org_id ON access.schedules(org_id);
CREATE INDEX idx_schedules_badge_id ON access.schedules(badge_id);
CREATE INDEX idx_schedules_zone_id ON access.schedules(zone_id);
CREATE INDEX idx_schedules_day_of_week ON access.schedules(day_of_week);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Helper function to check if user is org member
CREATE OR REPLACE FUNCTION access.is_org_member(org_uuid UUID, user_uuid UUID)
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
CREATE OR REPLACE FUNCTION access.is_platform_admin(user_uuid UUID)
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

-- RLS: zones
ALTER TABLE access.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read zones in their org"
  ON access.zones FOR SELECT
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert zones in their org"
  ON access.zones FOR INSERT
  WITH CHECK (access.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update zones in their org"
  ON access.zones FOR UPDATE
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete zones"
  ON access.zones FOR DELETE
  USING (access.is_platform_admin(auth.uid()));

-- RLS: badges
ALTER TABLE access.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read badges in their org"
  ON access.badges FOR SELECT
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert badges in their org"
  ON access.badges FOR INSERT
  WITH CHECK (access.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update badges in their org"
  ON access.badges FOR UPDATE
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete badges"
  ON access.badges FOR DELETE
  USING (access.is_platform_admin(auth.uid()));

-- RLS: access_requests
ALTER TABLE access.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read access_requests in their org"
  ON access.access_requests FOR SELECT
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert access_requests in their org"
  ON access.access_requests FOR INSERT
  WITH CHECK (access.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update their own access_requests"
  ON access.access_requests FOR UPDATE
  USING (requester_id = auth.uid() OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete access_requests"
  ON access.access_requests FOR DELETE
  USING (access.is_platform_admin(auth.uid()));

-- RLS: access_logs
ALTER TABLE access.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read access_logs in their org"
  ON access.access_logs FOR SELECT
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert access_logs in their org"
  ON access.access_logs FOR INSERT
  WITH CHECK (access.is_org_member(org_id, auth.uid()));

-- No update/delete for access_logs (immutable)

-- RLS: schedules
ALTER TABLE access.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read schedules in their org"
  ON access.schedules FOR SELECT
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert schedules in their org"
  ON access.schedules FOR INSERT
  WITH CHECK (access.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update schedules in their org"
  ON access.schedules FOR UPDATE
  USING (access.is_org_member(org_id, auth.uid()) OR access.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete schedules"
  ON access.schedules FOR DELETE
  USING (access.is_platform_admin(auth.uid()));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION access.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER zones_updated_at
  BEFORE UPDATE ON access.zones
  FOR EACH ROW EXECUTE FUNCTION access.set_updated_at();

CREATE TRIGGER badges_updated_at
  BEFORE UPDATE ON access.badges
  FOR EACH ROW EXECUTE FUNCTION access.set_updated_at();

CREATE TRIGGER access_requests_updated_at
  BEFORE UPDATE ON access.access_requests
  FOR EACH ROW EXECUTE FUNCTION access.set_updated_at();

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON access.schedules
  FOR EACH ROW EXECUTE FUNCTION access.set_updated_at();

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA access TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA access TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA access TO authenticated;

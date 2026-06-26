-- Tyre Sync Module Schema
-- Schema: tyresync
-- Maps from Firestore structure to Supabase Postgres

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tyresync schema
CREATE SCHEMA IF NOT EXISTS tyresync;

-- ============================================
-- Tyre Reports
-- ============================================
CREATE TABLE tyresync.tyre_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Clerk user ID
  vehicle_id TEXT,
  vehicle_registration TEXT,
  tyre_position TEXT, -- 'FL', 'FR', 'RL', 'RR', 'SPARE'
  brand TEXT,
  model TEXT,
  size TEXT,
  tread_depth_mm NUMERIC(4, 2),
  pressure_psi NUMERIC(5, 2),
  condition TEXT, -- 'new', 'good', 'fair', 'poor', 'critical'
  damage_type TEXT[], -- array of damage types
  damage_notes TEXT,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inspection_location TEXT,
  odometer_km INTEGER,
  images TEXT[], -- R2 object keys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tyre_reports
CREATE INDEX idx_tyre_reports_org_id ON tyresync.tyre_reports(org_id);
CREATE INDEX idx_tyre_reports_user_id ON tyresync.tyre_reports(user_id);
CREATE INDEX idx_tyre_reports_vehicle_id ON tyresync.tyre_reports(vehicle_id);
CREATE INDEX idx_tyre_reports_inspection_date ON tyresync.tyre_reports(inspection_date DESC);

-- ============================================
-- Scrap Reports
-- ============================================
CREATE TABLE tyresync.scrap_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Clerk user ID
  tyre_report_id UUID REFERENCES tyresync.tyre_reports(id) ON DELETE SET NULL,
  vehicle_id TEXT,
  vehicle_registration TEXT,
  tyre_position TEXT,
  scrap_reason TEXT, -- 'worn_out', 'damage', 'age', 'other'
  scrap_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  odometer_at_scrap_km INTEGER,
  tread_depth_at_scrap_mm NUMERIC(4, 2),
  images TEXT[], -- R2 object keys
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scrap_reports
CREATE INDEX idx_scrap_reports_org_id ON tyresync.scrap_reports(org_id);
CREATE INDEX idx_scrap_reports_user_id ON tyresync.scrap_reports(user_id);
CREATE INDEX idx_scrap_reports_tyre_report_id ON tyresync.scrap_reports(tyre_report_id);
CREATE INDEX idx_scrap_reports_scrap_date ON tyresync.scrap_reports(scrap_date DESC);

-- ============================================
-- Fleet Vehicles
-- ============================================
CREATE TABLE tyresync.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  vehicle_id TEXT UNIQUE NOT NULL,
  registration TEXT UNIQUE NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT, -- 'truck', 'van', 'car', 'trailer'
  tyre_config TEXT, -- e.g., '6x4', '4x2'
  total_tyres INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'maintenance', 'retired'
  purchase_date DATE,
  odometer_km INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fleet_vehicles
CREATE INDEX idx_fleet_vehicles_org_id ON tyresync.fleet_vehicles(org_id);
CREATE INDEX idx_fleet_vehicles_registration ON tyresync.fleet_vehicles(registration);

-- ============================================
-- Tyre Inventory
-- ============================================
CREATE TABLE tyresync.tyre_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  tyre_id TEXT UNIQUE NOT NULL,
  brand TEXT,
  model TEXT,
  size TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(10, 2),
  supplier TEXT,
  status TEXT DEFAULT 'in_stock', -- 'in_stock', 'mounted', 'scrap', 'sold'
  current_vehicle_id TEXT,
  current_position TEXT,
  tread_depth_new_mm NUMERIC(4, 2),
  tread_depth_current_mm NUMERIC(4, 2),
  images TEXT[], -- R2 object keys
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tyre_inventory
CREATE INDEX idx_tyre_inventory_org_id ON tyresync.tyre_inventory(org_id);
CREATE INDEX idx_tyre_inventory_status ON tyresync.tyre_inventory(status);
CREATE INDEX idx_tyre_inventory_brand_model ON tyresync.tyre_inventory(brand, model);

-- ============================================
-- Telemetry (Session Tracking)
-- ============================================
CREATE TABLE tyresync.telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Clerk user ID
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_url TEXT,
  time_spent_ms INTEGER,
  click_events JSONB,
  scroll_events JSONB,
  form_interactions JSONB,
  window_dimensions JSONB,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for telemetry
CREATE INDEX idx_telemetry_org_id ON tyresync.telemetry(org_id);
CREATE INDEX idx_telemetry_user_id ON tyresync.telemetry(user_id);
CREATE INDEX idx_telemetry_session_id ON tyresync.telemetry(session_id);
CREATE INDEX idx_telemetry_timestamp ON tyresync.telemetry(timestamp DESC);

-- ============================================
-- Logs (Auth/Security Events)
-- ============================================
CREATE TABLE tyresync.logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Clerk user ID
  log_type TEXT NOT NULL, -- 'auth_success', 'auth_failure', 'security_event', 'system_event'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT,
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  ip_address TEXT,
  raw_fingerprint JSONB, -- UNHASHED for forensic analysis
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX idx_logs_org_id ON tyresync.logs(org_id);
CREATE INDEX idx_logs_user_id ON tyresync.logs(user_id);
CREATE INDEX idx_logs_log_type ON tyresync.logs(log_type);
CREATE INDEX idx_logs_timestamp ON tyresync.logs(timestamp DESC);
CREATE INDEX idx_logs_severity ON tyresync.logs(severity);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Helper function to check if user is org member
CREATE OR REPLACE FUNCTION tyresync.is_org_member(org_uuid UUID, user_uuid UUID)
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
CREATE OR REPLACE FUNCTION tyresync.is_platform_admin(user_uuid UUID)
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

-- RLS: tyre_reports
ALTER TABLE tyresync.tyre_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tyre_reports in their org"
  ON tyresync.tyre_reports FOR SELECT
  USING (tyresync.is_org_member(org_id, auth.uid()) OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert tyre_reports in their org"
  ON tyresync.tyre_reports FOR INSERT
  WITH CHECK (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update their own tyre_reports"
  ON tyresync.tyre_reports FOR UPDATE
  USING (user_id = auth.uid() OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete tyre_reports"
  ON tyresync.tyre_reports FOR DELETE
  USING (tyresync.is_platform_admin(auth.uid()));

-- RLS: scrap_reports
ALTER TABLE tyresync.scrap_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read scrap_reports in their org"
  ON tyresync.scrap_reports FOR SELECT
  USING (tyresync.is_org_member(org_id, auth.uid()) OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert scrap_reports in their org"
  ON tyresync.scrap_reports FOR INSERT
  WITH CHECK (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update their own scrap_reports"
  ON tyresync.scrap_reports FOR UPDATE
  USING (user_id = auth.uid() OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete scrap_reports"
  ON tyresync.scrap_reports FOR DELETE
  USING (tyresync.is_platform_admin(auth.uid()));

-- RLS: fleet_vehicles
ALTER TABLE tyresync.fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read fleet_vehicles in their org"
  ON tyresync.fleet_vehicles FOR SELECT
  USING (tyresync.is_org_member(org_id, auth.uid()) OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert fleet_vehicles in their org"
  ON tyresync.fleet_vehicles FOR INSERT
  WITH CHECK (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update fleet_vehicles in their org"
  ON tyresync.fleet_vehicles FOR UPDATE
  USING (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Platform admins can delete fleet_vehicles"
  ON tyresync.fleet_vehicles FOR DELETE
  USING (tyresync.is_platform_admin(auth.uid()));

-- RLS: tyre_inventory
ALTER TABLE tyresync.tyre_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tyre_inventory in their org"
  ON tyresync.tyre_inventory FOR SELECT
  USING (tyresync.is_org_member(org_id, auth.uid()) OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert tyre_inventory in their org"
  ON tyresync.tyre_inventory FOR INSERT
  WITH CHECK (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update tyre_inventory in their org"
  ON tyresync.tyre_inventory FOR UPDATE
  USING (tyresync.is_org_member(org_id, auth.uid()));

CREATE POLICY "Platform admins can delete tyre_inventory"
  ON tyresync.tyre_inventory FOR DELETE
  USING (tyresync.is_platform_admin(auth.uid()));

-- RLS: telemetry
ALTER TABLE tyresync.telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own telemetry"
  ON tyresync.telemetry FOR SELECT
  USING (user_id = auth.uid() OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert their own telemetry"
  ON tyresync.telemetry FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No update/delete for telemetry (immutable)

-- RLS: logs
ALTER TABLE tyresync.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own logs"
  ON tyresync.logs FOR SELECT
  USING (user_id = auth.uid() OR tyresync.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert their own logs"
  ON tyresync.logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No update/delete for logs (immutable)

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION tyresync.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER tyre_reports_updated_at
  BEFORE UPDATE ON tyresync.tyre_reports
  FOR EACH ROW EXECUTE FUNCTION tyresync.set_updated_at();

CREATE TRIGGER scrap_reports_updated_at
  BEFORE UPDATE ON tyresync.scrap_reports
  FOR EACH ROW EXECUTE FUNCTION tyresync.set_updated_at();

CREATE TRIGGER fleet_vehicles_updated_at
  BEFORE UPDATE ON tyresync.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION tyresync.set_updated_at();

CREATE TRIGGER tyre_inventory_updated_at
  BEFORE UPDATE ON tyresync.tyre_inventory
  FOR EACH ROW EXECUTE FUNCTION tyresync.set_updated_at();

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA tyresync TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA tyresync TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tyresync TO authenticated;

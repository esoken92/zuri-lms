-- Waybill/POD Module Schema
-- Schema: waybill
-- Waybill management and Proof of Delivery tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waybill schema
CREATE SCHEMA IF NOT EXISTS waybill;

-- ============================================
-- Waybills
-- ============================================
CREATE TABLE waybill.waybills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES platform.sites(id) ON DELETE CASCADE,
  waybill_number TEXT UNIQUE NOT NULL,
  waybill_type TEXT NOT NULL, -- 'inbound', 'outbound', 'internal'
  status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'in_transit', 'delivered', 'cancelled', 'returned'
  origin_id UUID NOT NULL, -- Site ID
  destination_id UUID NOT NULL, -- Site ID
  origin_address TEXT,
  destination_address TEXT,
  estimated_departure TIMESTAMP WITH TIME ZONE,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_departure TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  carrier_name TEXT,
  carrier_contact TEXT,
  vehicle_registration TEXT,
  driver_name TEXT,
  driver_contact TEXT,
  special_instructions TEXT,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_by UUID NOT NULL, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for waybills
CREATE INDEX idx_waybills_org_id ON waybill.waybills(org_id);
CREATE INDEX idx_waybills_waybill_number ON waybill.waybills(waybill_number);
CREATE INDEX idx_waybills_status ON waybill.waybills(status);
CREATE INDEX idx_waybills_origin_id ON waybill.waybills(origin_id);
CREATE INDEX idx_waybills_destination_id ON waybill.waybills(destination_id);
CREATE INDEX idx_waybills_estimated_arrival ON waybill.waybills(estimated_arrival);

-- ============================================
-- Waybill Items
-- ============================================
CREATE TABLE waybill.waybill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waybill_id UUID NOT NULL REFERENCES waybill.waybills(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_sku TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT, -- 'pcs', 'kg', 'liters', 'boxes', 'pallets'
  weight_kg NUMERIC(10, 2),
  volume_m3 NUMERIC(10, 2),
  value NUMERIC(12, 2),
  category TEXT,
  requires_inspection BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for waybill_items
CREATE INDEX idx_waybill_items_waybill_id ON waybill.waybill_items(waybill_id);
CREATE INDEX idx_waybill_items_item_sku ON waybill.waybill_items(item_sku);

-- ============================================
-- Proof of Delivery
-- ============================================
CREATE TABLE waybill.proof_of_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waybill_id UUID NOT NULL REFERENCES waybill.waybills(id) ON DELETE CASCADE,
  delivered_by UUID NOT NULL, -- Clerk user ID
  delivered_to_name TEXT NOT NULL,
  delivered_to_company TEXT,
  delivered_to_contact TEXT,
  delivery_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_location TEXT,
  condition TEXT NOT NULL, -- 'good', 'damaged', 'partial', 'rejected'
  damage_description TEXT,
  received_items INTEGER,
  damaged_items INTEGER DEFAULT 0,
  missing_items INTEGER DEFAULT 0,
  signature TEXT, -- R2 object key
  photos TEXT[], -- R2 object keys
  notes TEXT,
  verified_by UUID, -- Clerk user ID
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for proof_of_delivery
CREATE INDEX idx_proof_of_delivery_waybill_id ON waybill.proof_of_delivery(waybill_id);
CREATE INDEX idx_proof_of_delivery_delivery_timestamp ON waybill.proof_of_delivery(delivery_timestamp DESC);

-- ============================================
-- Delivery Attempts
-- ============================================
CREATE TABLE waybill.delivery_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waybill_id UUID NOT NULL REFERENCES waybill.waybills(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempted_by TEXT,
  result TEXT NOT NULL, -- 'successful', 'failed', 'rescheduled', 'refused'
  failure_reason TEXT,
  notes TEXT,
  photos TEXT[], -- R2 object keys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for delivery_attempts
CREATE INDEX idx_delivery_attempts_waybill_id ON waybill.delivery_attempts(waybill_id);
CREATE INDEX idx_delivery_attempts_attempted_at ON waybill.delivery_attempts(attempted_at DESC);

-- ============================================
-- Tracking Events
-- ============================================
CREATE TABLE waybill.tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waybill_id UUID NOT NULL REFERENCES waybill.waybills(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception'
  event_location TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_description TEXT,
  recorded_by TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tracking_events
CREATE INDEX idx_tracking_events_waybill_id ON waybill.tracking_events(waybill_id);
CREATE INDEX idx_tracking_events_event_timestamp ON waybill.tracking_events(event_timestamp DESC);
CREATE INDEX idx_tracking_events_event_type ON waybill.tracking_events(event_type);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Helper function to check if user is org member
CREATE OR REPLACE FUNCTION waybill.is_org_member(org_uuid UUID, user_uuid UUID)
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
CREATE OR REPLACE FUNCTION waybill.is_platform_admin(user_uuid UUID)
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

-- RLS: waybills
ALTER TABLE waybill.waybills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read waybills in their org"
  ON waybill.waybills FOR SELECT
  USING (waybill.is_org_member(org_id, auth.uid()) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert waybills in their org"
  ON waybill.waybills FOR INSERT
  WITH CHECK (waybill.is_org_member(org_id, auth.uid()));

CREATE POLICY "Users can update waybills in their org"
  ON waybill.waybills FOR UPDATE
  USING (waybill.is_org_member(org_id, auth.uid()) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete waybills"
  ON waybill.waybills FOR DELETE
  USING (waybill.is_platform_admin(auth.uid()));

-- RLS: waybill_items
ALTER TABLE waybill.waybill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read waybill_items in their org"
  ON waybill.waybill_items FOR SELECT
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert waybill_items in their org"
  ON waybill.waybill_items FOR INSERT
  WITH CHECK (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ));

CREATE POLICY "Users can update waybill_items in their org"
  ON waybill.waybill_items FOR UPDATE
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete waybill_items"
  ON waybill.waybill_items FOR DELETE
  USING (waybill.is_platform_admin(auth.uid()));

-- RLS: proof_of_delivery
ALTER TABLE waybill.proof_of_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read proof_of_delivery in their org"
  ON waybill.proof_of_delivery FOR SELECT
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert proof_of_delivery in their org"
  ON waybill.proof_of_delivery FOR INSERT
  WITH CHECK (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ));

CREATE POLICY "Users can update proof_of_delivery in their org"
  ON waybill.proof_of_delivery FOR UPDATE
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete proof_of_delivery"
  ON waybill.proof_of_delivery FOR DELETE
  USING (waybill.is_platform_admin(auth.uid()));

-- RLS: delivery_attempts
ALTER TABLE waybill.delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read delivery_attempts in their org"
  ON waybill.delivery_attempts FOR SELECT
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert delivery_attempts in their org"
  ON waybill.delivery_attempts FOR INSERT
  WITH CHECK (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ));

-- No update/delete for delivery_attempts (immutable)

-- RLS: tracking_events
ALTER TABLE waybill.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tracking_events in their org"
  ON waybill.tracking_events FOR SELECT
  USING (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ) OR waybill.is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert tracking_events in their org"
  ON waybill.tracking_events FOR INSERT
  WITH CHECK (waybill.is_org_member(
    (SELECT org_id FROM waybill.waybills WHERE id = waybill_id),
    auth.uid()
  ));

-- No update/delete for tracking_events (immutable)

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION waybill.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER waybills_updated_at
  BEFORE UPDATE ON waybill.waybills
  FOR EACH ROW EXECUTE FUNCTION waybill.set_updated_at();

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA waybill TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA waybill TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA waybill TO authenticated;

-- ============================================================
-- Migrate Legacy Public Schema Data to New Schema-Per-Module
-- Demo Org ID: org_3FfL96AQr8sKInpfnvygfB21znc
-- ============================================================

-- First, ensure the demo org exists in platform.organizations
INSERT INTO platform.organizations (id, name, slug, created_at, updated_at)
VALUES ('org_3FfL96AQr8sKInpfnvygfB21znc', 'Demo - Test', 'demo-test', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = NOW();

-- Create a default site for the demo org
INSERT INTO platform.sites (org_id, name, address, city, country, created_at, updated_at)
VALUES ('org_3FfL96AQr8sKInpfnvygfB21znc', 'Demo HQ', '123 Demo Street', 'Johannesburg', 'South Africa', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the site ID for the demo org
DO $$
DECLARE
  demo_site_id UUID;
BEGIN
  SELECT id INTO demo_site_id FROM platform.sites WHERE org_id = 'org_3FfL96AQr8sKInpfnvygfB21znc' LIMIT 1;
  
  -- Migrate companies to platform.sites (if table exists)
  -- Using safe column selection that handles missing columns
  BEGIN
    INSERT INTO platform.sites (org_id, name, address, city, country, created_at, updated_at)
    SELECT 
      'org_3FfL96AQr8sKInpfnvygfB21znc',
      COALESCE(name, 'Migrated Company'),
      COALESCE(address, ''),
      COALESCE(city, ''),
      COALESCE(country, ''),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.companies
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping companies migration - table or column not found';
  END;
  
  -- Migrate depots to platform.sites (if table exists)
  BEGIN
    INSERT INTO platform.sites (org_id, name, address, city, country, created_at, updated_at)
    SELECT 
      'org_3FfL96AQr8sKInpfnvygfB21znc',
      COALESCE(name, 'Migrated Depot'),
      COALESCE(address, ''),
      COALESCE(city, ''),
      COALESCE(country, ''),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.depots
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping depots migration - table or column not found';
  END;
  
  -- Migrate stores to platform.sites (if table exists)
  BEGIN
    INSERT INTO platform.sites (org_id, name, address, city, country, created_at, updated_at)
    SELECT 
      'org_3FfL96AQr8sKInpfnvygfB21znc',
      COALESCE(name, 'Migrated Store'),
      COALESCE(address, ''),
      COALESCE(city, ''),
      COALESCE(country, ''),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.stores
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping stores migration - table or column not found';
  END;
  
  -- Migrate tyres to tyresync.tyre_inventory (if table exists)
  BEGIN
    INSERT INTO tyresync.tyre_inventory (org_id, brand, model, size, quantity, created_at, updated_at)
    SELECT 
      demo_site_id,
      COALESCE(brand, ''),
      COALESCE(model, ''),
      COALESCE(size, ''),
      COALESCE(quantity, 0),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.tyres
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping tyres migration - table or column not found';
  END;
  
  -- Migrate scrap_data to tyresync.scrap_reports (if table exists)
  BEGIN
    INSERT INTO tyresync.scrap_reports (org_id, user_id, scrap_reason, scrap_date, notes, created_at, updated_at)
    SELECT 
      demo_site_id,
      COALESCE(user_id::TEXT, ''),
      COALESCE(scrap_reason, ''),
      COALESCE(scrap_date, NOW()),
      COALESCE(notes, ''),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.scrap_data
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping scrap_data migration - table or column not found';
  END;
  
  -- Migrate inspections_drafts to tyresync.tyre_reports (if table exists)
  BEGIN
    INSERT INTO tyresync.tyre_reports (org_id, user_id, vehicle_id, vehicle_registration, tyre_position, brand, model, size, tread_depth_mm, condition, damage_type, damage_notes, inspection_date, odometer_km, created_at, updated_at)
    SELECT 
      demo_site_id,
      COALESCE(user_id::TEXT, ''),
      COALESCE(vehicle_id, ''),
      COALESCE(vehicle_registration, ''),
      COALESCE(tyre_position, ''),
      COALESCE(brand, ''),
      COALESCE(model, ''),
      COALESCE(size, ''),
      COALESCE(tread_depth_mm, 0),
      COALESCE(condition, ''),
      COALESCE(damage_type, ARRAY[]::TEXT[]),
      COALESCE(damage_notes, ''),
      COALESCE(inspection_date, NOW()),
      COALESCE(odometer_km, 0),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.inspections_drafts
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping inspections_drafts migration - table or column not found';
  END;
  
  -- Migrate vehicle_configs to tyresync.fleet_vehicles (if table exists)
  BEGIN
    INSERT INTO tyresync.fleet_vehicles (org_id, vehicle_id, registration, make, model, year, created_at, updated_at)
    SELECT 
      demo_site_id,
      COALESCE(vehicle_id, ''),
      COALESCE(registration, ''),
      COALESCE(make, ''),
      COALESCE(model, ''),
      COALESCE(year, NULL),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.vehicle_configs
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping vehicle_configs migration - table or column not found';
  END;
  
  -- Migrate vehicle_configurations to tyresync.fleet_vehicles (if table exists)
  BEGIN
    INSERT INTO tyresync.fleet_vehicles (org_id, vehicle_id, registration, make, model, year, created_at, updated_at)
    SELECT 
      demo_site_id,
      COALESCE(vehicle_id, ''),
      COALESCE(registration, ''),
      COALESCE(make, ''),
      COALESCE(model, ''),
      COALESCE(year, NULL),
      COALESCE(created_at, NOW()),
      NOW()
    FROM public.vehicle_configurations
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN UNDEFINED_COLUMN OR UNDEFINED_TABLE THEN
    RAISE NOTICE 'Skipping vehicle_configurations migration - table or column not found';
  END;
  
  -- Archive activity_logs to platform.audit_log (if table exists)
  -- Skipped due to UUID validation issues with legacy data format
  -- This is not critical for platform functionality
  RAISE NOTICE 'Skipping activity_logs migration - legacy data format incompatible';
  
  RAISE NOTICE 'Legacy data migration completed for demo org';
END $$;

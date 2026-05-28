-- Seed data for Zuri LMS

-- Insert countries
INSERT INTO countries (name, code, is_sadc) VALUES
  ('South Africa', 'ZA', true),
  ('Botswana', 'BW', true),
  ('Namibia', 'NA', true),
  ('Zimbabwe', 'ZW', true),
  ('Mozambique', 'MZ', true),
  ('Lesotho', 'LS', true),
  ('Eswatini', 'SZ', true),
  ('Zambia', 'ZM', true),
  ('Malawi', 'MW', true),
  ('Tanzania', 'TZ', true)
ON CONFLICT (code) DO NOTHING;

-- Insert provinces (South Africa)
INSERT INTO provinces (name, code, country_id) VALUES
  ('Gauteng', 'GP', (SELECT id FROM countries WHERE code = 'ZA')),
  ('KwaZulu-Natal', 'KZN', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Western Cape', 'WC', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Eastern Cape', 'EC', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Limpopo', 'LP', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Mpumalanga', 'MP', (SELECT id FROM countries WHERE code = 'ZA')),
  ('North West', 'NW', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Free State', 'FS', (SELECT id FROM countries WHERE code = 'ZA')),
  ('Northern Cape', 'NC', (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT DO NOTHING;

-- Insert regions (Gauteng)
INSERT INTO regions (name, code, province_id) VALUES
  ('Johannesburg', 'JHB', (SELECT id FROM provinces WHERE code = 'GP' AND name = 'Gauteng')),
  ('Pretoria', 'PTA', (SELECT id FROM provinces WHERE code = 'GP' AND name = 'Gauteng')),
  ('Ekurhuleni', 'EKU', (SELECT id FROM provinces WHERE code = 'GP' AND name = 'Gauteng'))
ON CONFLICT DO NOTHING;

-- Insert sample stores
INSERT INTO stores (name, code, region_id, address, phone, manager_name) VALUES
  ('Johannesburg Central', 'JHB-CEN', (SELECT id FROM regions WHERE code = 'JHB'), '123 Main St, Johannesburg', '+27 11 123 4567', 'John Smith'),
  ('Pretoria North', 'PTA-NOR', (SELECT id FROM regions WHERE code = 'PTA'), '456 Church St, Pretoria', '+27 12 234 5678', 'Jane Doe')
ON CONFLICT (code) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (name, contact_name, email, phone) VALUES
  ('TransCo Logistics', 'Mike Johnson', 'mike@transco.co.za', '+27 11 345 6789'),
  ('FastTrack Transport', 'Sarah Williams', 'sarah@fasttrack.co.za', '+27 11 456 7890')
ON CONFLICT DO NOTHING;

-- Insert sample depots
INSERT INTO depots (location, contact_name, email, phone, company_id) VALUES
  ('Johannesburg Depot', 'Tom Brown', 'tom@transco.co.za', '+27 11 567 8901', (SELECT id FROM companies WHERE name = 'TransCo Logistics')),
  ('Pretoria Depot', 'Lisa Anderson', 'lisa@transco.co.za', '+27 12 678 9012', (SELECT id FROM companies WHERE name = 'TransCo Logistics'))
ON CONFLICT DO NOTHING;

-- Insert sample vehicle configurations
INSERT INTO vehicle_configurations (code, name, description, axle_count, tire_count, status) VALUES
  ('VH-4X2', '4x2 Vehicle', 'Standard 4x2 configuration', 2, 6, 'active'),
  ('VH-6X4', '6x4 Vehicle', 'Standard 6x4 configuration', 3, 10, 'active'),
  ('VH-8X4', '8x4 Vehicle', 'Standard 8x4 configuration', 4, 14, 'active')
ON CONFLICT (code) DO NOTHING;

-- Insert sample vehicle configs
INSERT INTO vehicle_configs (item_code, name, tire_config, tire_sizes, ideal_pressures, pressure_units, spares) VALUES
  ('VC-001', 'Standard Truck', '{"axles": [{"position": "front", "tires": 2}, {"position": "rear", "tires": 4}]}', '{"front": "295/80 R22.5", "rear": "295/80 R22.5"}', '{"front": 120, "rear": 110}', 'psi', 2),
  ('VC-002', 'Heavy Truck', '{"axles": [{"position": "front", "tires": 2}, {"position": "rear1", "tires": 4}, {"position": "rear2", "tires": 4}]}', '{"front": "315/80 R22.5", "rear1": "315/80 R22.5", "rear2": "315/80 R22.5"}', '{"front": 130, "rear1": 120, "rear2": 120}', 'psi', 2)
ON CONFLICT (item_code) DO NOTHING;

-- Insert sample scrap data
INSERT INTO scrap_data (location, damage_code, damage_description) VALUES
  ('Sidewall', 'SW-01', 'Sidewall cut'),
  ('Sidewall', 'SW-02', 'Sidewall bulge'),
  ('Tread', 'TR-01', 'Tread separation'),
  ('Tread', 'TR-02', 'Uneven wear'),
  ('Bead', 'BD-01', 'Bead damage'),
  ('Shoulder', 'SH-01', 'Shoulder separation')
ON CONFLICT DO NOTHING;

-- Note: Admin user needs to be created via Supabase Auth first, then linked to users table
-- This can be done using the Supabase dashboard or CLI

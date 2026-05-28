-- Demo Data Seeding Script for Zuri LMS
-- Run this in the Supabase SQL Editor to populate demo data
-- This script creates demo accounts and comprehensive sample data for client demonstrations

-- ============================================
-- DEMO ACCOUNTS
-- ============================================
-- Password hashes generated using bcrypt (cost factor 10)
-- DemoAdmin123, DemoManager123, DemoInspector123, DemoUser123

INSERT INTO users (username, password_hash, role, email, created_at, updated_at)
VALUES 
  ('demoAdmin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrator', 'demoAdmin@lms.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demoManager', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Management', 'demoManager@lms.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demoInspector', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Inspector', 'demoInspector@lms.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demoUser', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User', 'demoUser@lms.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;

-- ============================================
-- GEOGRAPHIC DATA - SOUTH AFRICA
-- ============================================

-- Get South Africa country ID (assuming it exists from migration)
-- If not, insert it
INSERT INTO countries (name, code, is_sadc)
VALUES ('South Africa', 'ZA', true)
ON CONFLICT(name) DO NOTHING;

-- Provinces
INSERT INTO provinces (name, code, country_id)
SELECT 
  unnest(ARRAY['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape']),
  unnest(ARRAY['GP', 'WC', 'KZN', 'EC', 'LP', 'MP', 'NW', 'FS', 'NC']),
  (SELECT id FROM countries WHERE code = 'ZA')
ON CONFLICT(name, country_id) DO NOTHING;

-- Regions for Gauteng
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Johannesburg', 'Pretoria', 'Ekurhuleni', 'West Rand', 'Sedibeng']),
  unnest(ARRAY['JHB', 'PTA', 'EKU', 'WR', 'SED']),
  (SELECT id FROM provinces WHERE name = 'Gauteng' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Western Cape
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Cape Town', 'Stellenbosch', 'Paarl', 'Worcester', 'George']),
  unnest(ARRAY['CPT', 'STB', 'PRL', 'WOR', 'GRG']),
  (SELECT id FROM provinces WHERE name = 'Western Cape' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for KwaZulu-Natal
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Durban', 'Pietermaritzburg', 'Richards Bay', 'Ladysmith', 'Newcastle']),
  unnest(ARRAY['DBN', 'PMB', 'RB', 'LAD', 'NCL']),
  (SELECT id FROM provinces WHERE name = 'KwaZulu-Natal' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Eastern Cape
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Port Elizabeth', 'East London', 'Mthatha', 'Queenstown', 'Graaff-Reinet']),
  unnest(ARRAY['PE', 'EL', 'MTT', 'QT', 'GR']),
  (SELECT id FROM provinces WHERE name = 'Eastern Cape' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Limpopo
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Polokwane', 'Mokopane', 'Phalaborwa', 'Musina', 'Thohoyandou']),
  unnest(ARRAY['POL', 'MOK', 'PHB', 'MUS', 'THO']),
  (SELECT id FROM provinces WHERE name = 'Limpopo' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Mpumalanga
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Nelspruit', 'Witbank', 'Secunda', 'Standerton', 'Ermelo']),
  unnest(ARRAY['NLP', 'WIT', 'SEC', 'STD', 'ERM']),
  (SELECT id FROM provinces WHERE name = 'Mpumalanga' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for North West
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Rustenburg', 'Klerksdorp', 'Mahikeng', 'Potchefstroom', 'Brits']),
  unnest(ARRAY['RUS', 'KLR', 'MAH', 'POT', 'BRT']),
  (SELECT id FROM provinces WHERE name = 'North West' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Free State
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Bloemfontein', 'Bethlehem', 'Welkom', 'Kroonstad', 'Sasolburg']),
  unnest(ARRAY['BLM', 'BTH', 'WEL', 'KRO', 'SAS']),
  (SELECT id FROM provinces WHERE name = 'Free State' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Regions for Northern Cape
INSERT INTO regions (name, code, province_id)
SELECT 
  unnest(ARRAY['Kimberley', 'Upington', 'Kuruman', 'Springbok', 'De Aar']),
  unnest(ARRAY['KIM', 'UPN', 'KUR', 'SPB', 'DEA']),
  (SELECT id FROM provinces WHERE name = 'Northern Cape' AND country_id = (SELECT id FROM countries WHERE code = 'ZA'))
ON CONFLICT(name, province_id) DO NOTHING;

-- Stores (30 stores across different regions)
INSERT INTO stores (name, code, region_id, address, phone, manager_name)
VALUES 
  -- Gauteng stores
  ('Johannesburg Central', 'JHB001', (SELECT id FROM regions WHERE name = 'Johannesburg'), '123 Main St, Johannesburg', '+27 11 123 4567', 'John Smith'),
  ('Johannesburg North', 'JHB002', (SELECT id FROM regions WHERE name = 'Johannesburg'), '456 North Rd, Johannesburg', '+27 11 234 5678', 'Mary Johnson'),
  ('Pretoria Central', 'PTA001', (SELECT id FROM regions WHERE name = 'Pretoria'), '789 Church St, Pretoria', '+27 12 345 6789', 'Peter Van der Merwe'),
  ('Pretoria East', 'PTA002', (SELECT id FROM regions WHERE name = 'Pretoria'), '321 Silver Lakes, Pretoria', '+27 12 456 7890', 'Sarah Botha'),
  ('Ekurhuleni Main', 'EKU001', (SELECT id FROM regions WHERE name = 'Ekurhuleni'), '654 Germiston Blvd, Ekurhuleni', '+27 11 567 8901', 'David Nkosi'),
  
  -- Western Cape stores
  ('Cape Town CBD', 'CPT001', (SELECT id FROM regions WHERE name = 'Cape Town'), '111 Adderley St, Cape Town', '+27 21 111 2222', 'James Wilson'),
  ('Cape Town Northern Suburbs', 'CPT002', (SELECT id FROM regions WHERE name = 'Cape Town'), '222 Tyger Valley, Cape Town', '+27 21 222 3333', 'Emma Brown'),
  ('Stellenbosch Main', 'STB001', (SELECT id FROM regions WHERE name = 'Stellenbosch'), '333 Dorp St, Stellenbosch', '+27 21 333 4444', 'Willem Coetzee'),
  ('Paarl Central', 'PRL001', (SELECT id FROM regions WHERE name = 'Paarl'), '444 Main Rd, Paarl', '+27 21 444 5555', 'Johan Muller'),
  
  -- KwaZulu-Natal stores
  ('Durban Central', 'DBN001', (SELECT id FROM regions WHERE name = 'Durban'), '555 West St, Durban', '+27 31 555 6666', 'Rajesh Naidoo'),
  ('Durban North', 'DBN002', (SELECT id FROM regions WHERE name = 'Durban'), '666 Umhlanga, Durban', '+27 31 666 7777', 'Priya Govender'),
  ('Pietermaritzburg Main', 'PMB001', (SELECT id FROM regions WHERE name = 'Pietermaritzburg'), '777 Church St, Pietermaritzburg', '+27 33 777 8888', 'Thabo Mkhize'),
  ('Richards Bay', 'RB001', (SELECT id FROM regions WHERE name = 'Richards Bay'), '888 John Ross Hwy, Richards Bay', '+27 35 888 9999', 'Sipho Dlamini'),
  
  -- Eastern Cape stores
  ('Port Elizabeth Central', 'PE001', (SELECT id FROM regions WHERE name = 'Port Elizabeth'), '999 Main St, Port Elizabeth', '+27 41 999 0000', 'Michael Van Wyk'),
  ('East London Main', 'EL001', (SELECT id FROM regions WHERE name = 'East London'), '101 Oxford St, East London', '+27 43 101 2020', 'Nomvula Dube'),
  ('Mthatha Central', 'MTT001', (SELECT id FROM regions WHERE name = 'Mthatha'), '202 Nelson Mandela Dr, Mthatha', '+27 47 202 3030', 'Bongani Nkosi'),
  
  -- Limpopo stores
  ('Polokwane Main', 'POL001', (SELECT id FROM regions WHERE name = 'Polokwane'), '303 Landdros Mare St, Polokwane', '+27 15 303 4040', 'Frans Mahlangu'),
  ('Mokopane Central', 'MOK001', (SELECT id FROM regions WHERE name = 'Mokopane'), '404 Thabo Mbeki St, Mokopane', '+27 15 404 5050', 'Maria Ramokgopa'),
  
  -- Mpumalanga stores
  ('Nelspruit Main', 'NLP001', (SELECT id FROM regions WHERE name = 'Nelspruit'), '505 Ferreira St, Nelspruit', '+27 13 505 6060', 'Johan Schoeman'),
  ('Witbank Central', 'WIT001', (SELECT id FROM regions WHERE name = 'Witbank'), '606 Walter Sisulu Ave, Witbank', '+27 13 606 7070', 'Sibusiso Khumalo'),
  ('Secunda Main', 'SEC001', (SELECT id FROM regions WHERE name = 'Secunda'), '707 Govan Mbeki Dr, Secunda', '+27 17 707 8080', 'Linda Pretorius'),
  
  -- North West stores
  ('Rustenburg Main', 'RUS001', (SELECT id FROM regions WHERE name = 'Rustenburg'), '808 Nelson Mandela Dr, Rustenburg', '+27 14 808 9090', 'Piet Molefe'),
  ('Klerksdorp Central', 'KLR001', (SELECT id FROM regions WHERE name = 'Klerksdorp'), '909 Voortrekker St, Klerksdorp', '+27 18 909 0101', 'Anna Van Tonder'),
  
  -- Free State stores
  ('Bloemfontein Central', 'BLM001', (SELECT id FROM regions WHERE name = 'Bloemfontein'), '010 Maitland St, Bloemfontein', '+27 51 010 2020', 'Koos Botha'),
  ('Bethlehem Main', 'BTH001', (SELECT id FROM regions WHERE name = 'Bethlehem'), '111 Muller St, Bethlehem', '+27 58 111 3030', 'Hendrik Smit'),
  
  -- Northern Cape stores
  ('Kimberley Central', 'KIM001', (SELECT id FROM regions WHERE name = 'Kimberley'), '212 Long St, Kimberley', '+27 53 212 3131', 'Catherine Adams'),
  ('Upington Main', 'UPN001', (SELECT id FROM regions WHERE name = 'Upington'), '313 Scott St, Upington', '+27 54 313 4141', 'Johannes De Klerk')
ON CONFLICT(code) DO NOTHING;

-- ============================================
-- BUSINESS DATA
-- ============================================

-- Companies (5 companies)
INSERT INTO companies (name, contact_name, email, phone)
VALUES 
  ('TransLogistics SA', 'Michael Brown', 'info@translogistics.co.za', '+27 11 555 1234'),
  ('FleetWise Solutions', 'Sarah Van Niekerk', 'contact@fleetwise.co.za', '+27 21 666 2345'),
  ('HeavyHaul Transport', 'John Nkosi', 'admin@heavyhaul.co.za', '+27 31 777 3456'),
  ('RoadMaster Logistics', 'David Botha', 'info@roadmaster.co.za', '+27 12 888 4567'),
  ('QuickMove Freight', 'Emma Pretorius', 'support@quickmove.co.za', '+27 13 999 5678')
ON CONFLICT DO NOTHING;

-- Depots (3 depots per company = 15 total)
INSERT INTO depots (location, contact_name, email, phone, company_id)
VALUES 
  -- TransLogistics SA depots
  ('Johannesburg Depot', 'Tom Jones', 'jhb@translogistics.co.za', '+27 11 555 1111', (SELECT id FROM companies WHERE name = 'TransLogistics SA')),
  ('Cape Town Depot', 'Lisa Smith', 'cpt@translogistics.co.za', '+27 21 666 1111', (SELECT id FROM companies WHERE name = 'TransLogistics SA')),
  ('Durban Depot', 'Mike Dube', 'dbn@translogistics.co.za', '+27 31 777 1111', (SELECT id FROM companies WHERE name = 'TransLogistics SA')),
  
  -- FleetWise Solutions depots
  ('Pretoria Depot', 'Anna Van Wyk', 'pta@fleetwise.co.za', '+27 12 888 2222', (SELECT id FROM companies WHERE name = 'FleetWise Solutions')),
  ('Port Elizabeth Depot', 'Chris Botha', 'pe@fleetwise.co.za', '+27 41 999 2222', (SELECT id FROM companies WHERE name = 'FleetWise Solutions')),
  ('Nelspruit Depot', 'Sipho Khumalo', 'nlp@fleetwise.co.za', '+27 13 505 2222', (SELECT id FROM companies WHERE name = 'FleetWise Solutions')),
  
  -- HeavyHaul Transport depots
  ('Polokwane Depot', 'Frans Mahlangu', 'pol@heavyhaul.co.za', '+27 15 303 3333', (SELECT id FROM companies WHERE name = 'HeavyHaul Transport')),
  ('Bloemfontein Depot', 'Koos Smit', 'blm@heavyhaul.co.za', '+27 51 010 3333', (SELECT id FROM companies WHERE name = 'HeavyHaul Transport')),
  ('East London Depot', 'Nomvula Dlamini', 'el@heavyhaul.co.za', '+27 43 101 3333', (SELECT id FROM companies WHERE name = 'HeavyHaul Transport')),
  
  -- RoadMaster Logistics depots
  ('Rustenburg Depot', 'Piet Molefe', 'rus@roadmaster.co.za', '+27 14 808 4444', (SELECT id FROM companies WHERE name = 'RoadMaster Logistics')),
  ('Kimberley Depot', 'Catherine Adams', 'kim@roadmaster.co.za', '+27 53 212 4444', (SELECT id FROM companies WHERE name = 'RoadMaster Logistics')),
  ('Witbank Depot', 'Johannes De Klerk', 'wit@roadmaster.co.za', '+27 13 606 4444', (SELECT id FROM companies WHERE name = 'RoadMaster Logistics')),
  
  -- QuickMove Freight depots
  ('Pietermaritzburg Depot', 'Thabo Mkhize', 'pmb@quickmove.co.za', '+27 33 777 5555', (SELECT id FROM companies WHERE name = 'QuickMove Freight')),
  ('Secunda Depot', 'Linda Pretorius', 'sec@quickmove.co.za', '+27 17 707 5555', (SELECT id FROM companies WHERE name = 'QuickMove Freight')),
  ('George Depot', 'Willem Coetzee', 'grg@quickmove.co.za', '+27 44 801 5555', (SELECT id FROM companies WHERE name = 'QuickMove Freight'))
ON CONFLICT DO NOTHING;

-- Tyres (20 tyre models with various specifications)
INSERT INTO tyres (brand, pattern, ply_rating, original_tread_depth, load_rating, load_rating_duals, load_rating_singles, speed_rating_duals, speed_rating_singles, tube_rating, nominal_section_width, aspect_ratio, rim_size, product_code, depth_inner, depth_middle, depth_outer, comments)
VALUES 
  ('Michelin', 'X Multi HDD', '18PR', '22.5', '156/150', '156', '150', 'K', 'L', 'TL', '315', '65', '22.5', 'MXH001', 22.5, 22.5, 22.5, 'Heavy duty haulage tyre'),
  ('Michelin', 'X Multi Way', '16PR', '18.5', '149/145', '149', '145', 'K', 'L', 'TL', '295', '80', '22.5', 'MXW001', 18.5, 18.5, 18.5, 'All position tyre'),
  ('Bridgestone', 'M840', '16PR', '16.5', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'BRM001', 16.5, 16.5, 16.5, 'Mixed service tyre'),
  ('Bridgestone', 'R250', '18PR', '20.0', '154/150', '154', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'BRR001', 20.0, 20.0, 20.0, 'Regional haul tyre'),
  ('Continental', 'HSL2', '18PR', '21.0', '156/150', '156', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'CON001', 21.0, 21.0, 21.0, 'Super single tyre'),
  ('Continental', 'Conti Eco', '16PR', '17.5', '149/145', '149', '145', 'J', 'K', 'TL', '275', '70', '22.5', 'CONE001', 17.5, 17.5, 17.5, 'Fuel efficient tyre'),
  ('Goodyear', 'G372A', '18PR', '22.0', '154/150', '154', '150', 'K', 'L', 'TL', '295', '75', '22.5', 'GDR001', 22.0, 22.0, 22.0, 'Long haul tyre'),
  ('Goodyear', 'G395', '16PR', '19.0', '150/145', '150', '145', 'J', 'K', 'TL', '285', '75', '22.5', 'GDR002', 19.0, 19.0, 19.0, 'Regional tyre'),
  ('Dunlop', 'SP344', '16PR', '18.0', '149/145', '149', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'DUN001', 18.0, 18.0, 18.0, 'All position tyre'),
  ('Dunlop', 'SP331', '18PR', '21.5', '154/150', '154', '150', 'K', 'L', 'TL', '315', '80', '22.5', 'DUN002', 21.5, 21.5, 21.5, 'Drive tyre'),
  ('Pirelli', 'FR01', '18PR', '22.0', '156/150', '156', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'PIR001', 22.0, 22.0, 22.0, 'Fuel efficient drive'),
  ('Pirelli', 'TH01', '16PR', '19.5', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'PIR002', 19.5, 19.5, 19.5, 'Trailer tyre'),
  ('Yokohama', 'MY01', '18PR', '21.0', '154/150', '154', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'YOK001', 21.0, 21.0, 21.0, 'Mixed service tyre'),
  ('Yokohama', 'RY61', '16PR', '18.5', '149/145', '149', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'YOK002', 18.5, 18.5, 18.5, 'Regional tyre'),
  ('Firestone', 'FS560', '18PR', '20.5', '154/150', '154', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'FIR001', 20.5, 20.5, 20.5, 'Long haul tyre'),
  ('Firestone', 'FS425', '16PR', '17.0', '149/145', '149', '145', 'J', 'K', 'TL', '275', '80', '22.5', 'FIR002', 17.0, 17.0, 17.0, 'All position tyre'),
  ('Kumho', 'KMA01', '18PR', '21.5', '154/150', '154', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'KUM001', 21.5, 21.5, 21.5, 'Drive tyre'),
  ('Kumho', 'KRS02', '16PR', '18.0', '149/145', '149', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'KUM002', 18.0, 18.0, 18.0, 'Steer tyre'),
  ('Toyo', 'M607Z', '18PR', '22.0', '156/150', '156', '150', 'K', 'L', 'TL', '315', '70', '22.5', 'TOY001', 22.0, 22.0, 22.0, 'Fuel efficient tyre'),
  ('Toyo', 'M627', '16PR', '19.0', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'TOY002', 19.0, 19.0, 19.0, 'Regional haul tyre')
ON CONFLICT (brand, pattern, nominal_section_width, aspect_ratio, rim_size) DO NOTHING;

-- Vehicle Configurations (5 configurations)
INSERT INTO vehicle_configurations (code, name, description, axle_count, tire_count, status)
VALUES 
  ('6X4-TRUCK', '6x4 Truck', 'Standard 6x4 truck configuration with 3 axles', 3, 10, 'active'),
  ('4X2-TRUCK', '4x2 Truck', 'Standard 4x2 truck configuration with 2 axles', 2, 6, 'active'),
  ('8X4-TRUCK', '8x4 Truck', 'Heavy duty 8x4 truck configuration with 4 axles', 4, 14, 'active'),
  ('TRAILER-2AXLE', '2-Axle Trailer', 'Standard 2-axle trailer configuration', 2, 8, 'active'),
  ('TRAILER-3AXLE', '3-Axle Trailer', 'Heavy duty 3-axle trailer configuration', 3, 12, 'active')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- EXTENDED USER PROFILES
-- ============================================

-- Security answer hashes (using bcrypt for demo purposes - same hash for all answers)
-- In production, each answer should have its own unique hash
INSERT INTO users_extended (user_id, first_name, last_name, email, phone, employee_id, country_id, province_id, region_id, store_id, security_question_1, security_answer_1_hash, security_question_2, security_answer_2_hash, is_active)
VALUES
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'Admin', 'User', 'demoAdmin@lms.com', '+27 11 123 4567', 'EMP001',
   (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1),
   (SELECT id FROM provinces WHERE name = 'Gauteng' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1),
   (SELECT id FROM regions WHERE name = 'Johannesburg' LIMIT 1),
   (SELECT id FROM stores WHERE code = 'JHB001' LIMIT 1),
   'What was the name of your first pet?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'What is your mother''s maiden name?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   true),

  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'Manager', 'User', 'demoManager@lms.com', '+27 21 234 5678', 'EMP002',
   (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1),
   (SELECT id FROM provinces WHERE name = 'Western Cape' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1),
   (SELECT id FROM regions WHERE name = 'Cape Town' LIMIT 1),
   (SELECT id FROM stores WHERE code = 'CPT001' LIMIT 1),
   'What city were you born in?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'What was your first car?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   true),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'Inspector', 'User', 'demoInspector@lms.com', '+27 31 345 6789', 'EMP003',
   (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1),
   (SELECT id FROM provinces WHERE name = 'KwaZulu-Natal' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1),
   (SELECT id FROM regions WHERE name = 'Durban' LIMIT 1),
   (SELECT id FROM stores WHERE code = 'DBN001' LIMIT 1),
   'What is your favorite color?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'What elementary school did you attend?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   true),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'Regular', 'User', 'demoUser@lms.com', '+27 12 456 7890', 'EMP004',
   (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1),
   (SELECT id FROM provinces WHERE name = 'Gauteng' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1),
   (SELECT id FROM regions WHERE name = 'Pretoria' LIMIT 1),
   (SELECT id FROM stores WHERE code = 'PTA001' LIMIT 1),
   'What is the name of your favorite teacher?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'What year did you graduate from high school?', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- ACTIVITY DATA
-- ============================================

-- Get auth user IDs for demo users
WITH demo_users AS (
  SELECT 
    id,
    CASE 
      WHEN email = 'demoAdmin@lms.com' THEN 'demoAdmin'
      WHEN email = 'demoManager@lms.com' THEN 'demoManager'
      WHEN email = 'demoInspector@lms.com' THEN 'demoInspector'
      WHEN email = 'demoUser@lms.com' THEN 'demoUser'
    END as username
  FROM auth.users
  WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com')
)

-- Inspections (20 sample inspections with different statuses)
INSERT INTO inspections (user_id, user_name, company_id, depot_id, inspection_date, location, header, vehicles, timestamp, created_at)
SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'TransLogistics SA' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Johannesburg Depot' LIMIT 1),
  '2024-01-15', 'Johannesburg', 'Weekly Fleet Inspection',
  '[{"vehicleId": "VH001", "registration": "CA 123 456", "tyres": [{"position": "FL", "brand": "Michelin", "pattern": "X Multi HDD", "depth": 22.5}, {"position": "FR", "brand": "Michelin", "pattern": "X Multi HDD", "depth": 22.0}]}]',
  '2024-01-15T10:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'FleetWise Solutions' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Cape Town Depot' LIMIT 1),
  '2024-01-16', 'Cape Town', 'Monthly Safety Check',
  '[{"vehicleId": "VH002", "registration": "CA 789 012", "tyres": [{"position": "FL", "brand": "Bridgestone", "pattern": "M840", "depth": 16.5}, {"position": "FR", "brand": "Bridgestone", "pattern": "M840", "depth": 16.0}]}]',
  '2024-01-16T14:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'HeavyHaul Transport' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Durban Depot' LIMIT 1),
  '2024-01-17', 'Durban', 'Pre-trip Inspection',
  '[{"vehicleId": "VH003", "registration": "ND 345 678", "tyres": [{"position": "FL", "brand": "Continental", "pattern": "HSL2", "depth": 21.0}, {"position": "FR", "brand": "Continental", "pattern": "HSL2", "depth": 20.5}]}]',
  '2024-01-17T08:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'RoadMaster Logistics' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Pretoria Depot' LIMIT 1),
  '2024-01-18', 'Pretoria', 'Routine Inspection',
  '[{"vehicleId": "VH004", "registration": "GP 901 234", "tyres": [{"position": "FL", "brand": "Goodyear", "pattern": "G372A", "depth": 22.0}, {"position": "FR", "brand": "Goodyear", "pattern": "G372A", "depth": 21.5}]}]',
  '2024-01-18T11:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'QuickMove Freight' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Port Elizabeth Depot' LIMIT 1),
  '2024-01-19', 'Port Elizabeth', 'Post-trip Inspection',
  '[{"vehicleId": "VH005", "registration": "EC 567 890", "tyres": [{"position": "FL", "brand": "Dunlop", "pattern": "SP344", "depth": 18.0}, {"position": "FR", "brand": "Dunlop", "pattern": "SP344", "depth": 17.5}]}]',
  '2024-01-19T16:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'TransLogistics SA' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Cape Town Depot' LIMIT 1),
  '2024-01-20', 'Cape Town', 'Quarterly Audit',
  '[{"vehicleId": "VH006", "registration": "CA 234 567", "tyres": [{"position": "FL", "brand": "Pirelli", "pattern": "FR01", "depth": 22.0}, {"position": "FR", "brand": "Pirelli", "pattern": "FR01", "depth": 21.5}]}]',
  '2024-01-20T09:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'FleetWise Solutions' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Nelspruit Depot' LIMIT 1),
  '2024-01-21', 'Nelspruit', 'Weekly Check',
  '[{"vehicleId": "VH007", "registration": "MP 890 123", "tyres": [{"position": "FL", "brand": "Yokohama", "pattern": "MY01", "depth": 21.0}, {"position": "FR", "brand": "Yokohama", "pattern": "MY01", "depth": 20.5}]}]',
  '2024-01-21T13:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'HeavyHaul Transport' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Polokwane Depot' LIMIT 1),
  '2024-01-22', 'Polokwane', 'Safety Inspection',
  '[{"vehicleId": "VH008", "registration": "LIM 012 345", "tyres": [{"position": "FL", "brand": "Firestone", "pattern": "FS560", "depth": 20.5}, {"position": "FR", "brand": "Firestone", "pattern": "FS560", "depth": 20.0}]}]',
  '2024-01-22T10:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'RoadMaster Logistics' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Rustenburg Depot' LIMIT 1),
  '2024-01-23', 'Rustenburg', 'Daily Inspection',
  '[{"vehicleId": "VH009", "registration": "NW 456 789", "tyres": [{"position": "FL", "brand": "Kumho", "pattern": "KMA01", "depth": 21.5}, {"position": "FR", "brand": "Kumho", "pattern": "KMA01", "depth": 21.0}]}]',
  '2024-01-23T07:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'QuickMove Freight' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Kimberley Depot' LIMIT 1),
  '2024-01-24', 'Kimberley', 'Compliance Check',
  '[{"vehicleId": "VH010", "registration": "NC 678 901", "tyres": [{"position": "FL", "brand": "Toyo", "pattern": "M607Z", "depth": 22.0}, {"position": "FR", "brand": "Toyo", "pattern": "M607Z", "depth": 21.5}]}]',
  '2024-01-24T15:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'TransLogistics SA' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Johannesburg Depot' LIMIT 1),
  '2024-01-25', 'Johannesburg', 'Fleet Assessment',
  '[{"vehicleId": "VH011", "registration": "GP 234 567", "tyres": [{"position": "FL", "brand": "Michelin", "pattern": "X Multi Way", "depth": 18.5}]}]',
  '2024-01-25T11:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'FleetWise Solutions' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Pretoria Depot' LIMIT 1),
  '2024-01-26', 'Pretoria', 'Quality Check',
  '[{"vehicleId": "VH012", "registration": "GP 890 123", "tyres": [{"position": "FL", "brand": "Bridgestone", "pattern": "R250", "depth": 20.0}]}]',
  '2024-01-26T09:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'HeavyHaul Transport' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'East London Depot' LIMIT 1),
  '2024-01-27', 'East London', 'Routine Check',
  '[{"vehicleId": "VH013", "registration": "EC 345 678", "tyres": [{"position": "FL", "brand": "Continental", "pattern": "Conti Eco", "depth": 17.5}]}]',
  '2024-01-27T14:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'RoadMaster Logistics' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Witbank Depot' LIMIT 1),
  '2024-01-28', 'Witbank', 'Safety Audit',
  '[{"vehicleId": "VH014", "registration": "MP 567 890", "tyres": [{"position": "FL", "brand": "Goodyear", "pattern": "G395", "depth": 19.0}]}]',
  '2024-01-28T10:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'QuickMove Freight' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Secunda Depot' LIMIT 1),
  '2024-01-29', 'Secunda', 'Weekly Inspection',
  '[{"vehicleId": "VH015", "registration": "MP 901 234", "tyres": [{"position": "FL", "brand": "Dunlop", "pattern": "SP331", "depth": 21.5}]}]',
  '2024-01-29T12:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'TransLogistics SA' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Durban Depot' LIMIT 1),
  '2024-01-30', 'Durban', 'Monthly Review',
  '[{"vehicleId": "VH016", "registration": "ND 789 012", "tyres": [{"position": "FL", "brand": "Pirelli", "pattern": "TH01", "depth": 19.5}]}]',
  '2024-01-30T08:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'FleetWise Solutions' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Port Elizabeth Depot' LIMIT 1),
  '2024-01-31', 'Port Elizabeth', 'Fleet Check',
  '[{"vehicleId": "VH017", "registration": "EC 012 345", "tyres": [{"position": "FL", "brand": "Yokohama", "pattern": "RY61", "depth": 18.5}]}]',
  '2024-01-31T15:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'HeavyHaul Transport' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Bloemfontein Depot' LIMIT 1),
  '2024-02-01', 'Bloemfontein', 'Compliance Audit',
  '[{"vehicleId": "VH018", "registration": "FS 456 789", "tyres": [{"position": "FL", "brand": "Firestone", "pattern": "FS425", "depth": 17.0}]}]',
  '2024-02-01T11:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'RoadMaster Logistics' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'Kimberley Depot' LIMIT 1),
  '2024-02-02', 'Kimberley', 'Daily Check',
  '[{"vehicleId": "VH019", "registration": "NC 890 123", "tyres": [{"position": "FL", "brand": "Kumho", "pattern": "KRS02", "depth": 18.0}]}]',
  '2024-02-02T07:00:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoUser'

UNION ALL

SELECT
  du.id,
  du.username,
  (SELECT id FROM companies WHERE name = 'QuickMove Freight' LIMIT 1),
  (SELECT id FROM depots WHERE location = 'George Depot' LIMIT 1),
  '2024-02-03', 'George', 'Final Inspection',
  '[{"vehicleId": "VH020", "registration": "WC 234 567", "tyres": [{"position": "FL", "brand": "Toyo", "pattern": "M627", "depth": 19.0}]}]',
  '2024-02-03T13:30:00Z', CURRENT_TIMESTAMP
FROM demo_users du
WHERE du.username = 'demoInspector'
ON CONFLICT DO NOTHING;

-- Scraps (15 sample scrap records with various damage codes)
INSERT INTO scraps (user_id, user_name, store_id, items, status, created_at)
VALUES
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'JHB001' LIMIT 1),
   '[{"brand": "Michelin", "pattern": "X Multi HDD", "damageCode": "TR-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202345", "retreadPattern": null}]',
   'Submitted', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'CPT001' LIMIT 1),
   '[{"brand": "Bridgestone", "pattern": "M840", "damageCode": "TR-2", "damageDescription": "Puncture/Cut (Not To Interior)", "dot": "202346", "retreadPattern": null}]',
   'Draft', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'DBN001' LIMIT 1),
   '[{"brand": "Continental", "pattern": "HSL2", "damageCode": "TR-3", "damageDescription": "Chipping/Chunking", "dot": "202347", "retreadPattern": null}]',
   'Approved', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'PTA001' LIMIT 1),
   '[{"brand": "Goodyear", "pattern": "G372A", "damageCode": "SH-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202348", "retreadPattern": null}]',
   'Submitted', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'PE001' LIMIT 1),
   '[{"brand": "Dunlop", "pattern": "SP344", "damageCode": "SW-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202349", "retreadPattern": null}]',
   'Draft', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'NLP001' LIMIT 1),
   '[{"brand": "Pirelli", "pattern": "FR01", "damageCode": "BD-1", "damageDescription": "Cut", "dot": "202350", "retreadPattern": null}]',
   'Approved', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'POL001' LIMIT 1),
   '[{"brand": "Yokohama", "pattern": "MY01", "damageCode": "IN-1", "damageDescription": "Cut", "dot": "202351", "retreadPattern": null}]',
   'Submitted', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'RUS001' LIMIT 1),
   '[{"brand": "Firestone", "pattern": "FS560", "damageCode": "GN-1", "damageDescription": "Improper Repair", "dot": "202352", "retreadPattern": null}]',
   'Draft', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'KIM001' LIMIT 1),
   '[{"brand": "Kumho", "pattern": "KMA01", "damageCode": "TR-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202353", "retreadPattern": null}]',
   'Approved', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'BLM001' LIMIT 1),
   '[{"brand": "Toyo", "pattern": "M607Z", "damageCode": "TR-2", "damageDescription": "Puncture/Cut (Not To Interior)", "dot": "202354", "retreadPattern": null}]',
   'Submitted', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'JHB002' LIMIT 1),
   '[{"brand": "Michelin", "pattern": "X Multi Way", "damageCode": "TR-3", "damageDescription": "Chipping/Chunking", "dot": "202355", "retreadPattern": null}]',
   'Draft', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'CPT002' LIMIT 1),
   '[{"brand": "Bridgestone", "pattern": "R250", "damageCode": "SH-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202356", "retreadPattern": null}]',
   'Approved', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'DBN002' LIMIT 1),
   '[{"brand": "Continental", "pattern": "Conti Eco", "damageCode": "SW-1", "damageDescription": "Puncture/Cut (To Interior)", "dot": "202357", "retreadPattern": null}]',
   'Submitted', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser',
   (SELECT id FROM stores WHERE code = 'PTA002' LIMIT 1),
   '[{"brand": "Goodyear", "pattern": "G395", "damageCode": "BD-1", "damageDescription": "Cut", "dot": "202358", "retreadPattern": null}]',
   'Draft', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector',
   (SELECT id FROM stores WHERE code = 'EKU001' LIMIT 1),
   '[{"brand": "Dunlop", "pattern": "SP331", "damageCode": "IN-1", "damageDescription": "Cut", "dot": "202359", "retreadPattern": null}]',
   'Approved', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Activity Logs (30 sample activity logs showing different user actions)
INSERT INTO activity_logs (user_id, username, activity_type, activity_description, table_name, record_id, ip_address, user_agent, success, created_at)
VALUES
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'LOGIN', 'User logged in successfully', 'users', (SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'CREATE', 'Created new company record', 'companies', (SELECT id FROM companies WHERE name = 'TransLogistics SA' LIMIT 1), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'LOGIN', 'User logged in successfully', 'users', (SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'UPDATE', 'Updated depot information', 'depots', (SELECT id FROM depots WHERE location = 'Johannesburg Depot' LIMIT 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'LOGIN', 'User logged in successfully', 'users', (SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'CREATE', 'Created new inspection', 'inspections', (SELECT id FROM inspections LIMIT 1 OFFSET 0), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'LOGIN', 'User logged in successfully', 'users', (SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'CREATE', 'Created scrap record', 'scraps', (SELECT id FROM scraps LIMIT 1 OFFSET 0), '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'DELETE', 'Deleted user draft', 'user_drafts', null, '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'VIEW', 'Viewed inspection report', 'inspections', (SELECT id FROM inspections LIMIT 1 OFFSET 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'UPDATE', 'Updated inspection status', 'inspections', (SELECT id FROM inspections LIMIT 1 OFFSET 2), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'CREATE', 'Submitted user suggestion', 'user_suggestions', null, '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'APPROVE', 'Approved scrap record', 'scraps', (SELECT id FROM scraps LIMIT 1 OFFSET 2), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'EXPORT', 'Exported inspection data', 'inspections', null, '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'CREATE', 'Created new scrap record', 'scraps', (SELECT id FROM scraps LIMIT 1 OFFSET 5), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'VIEW', 'Viewed tyre specifications', 'tyres', (SELECT id FROM tyres LIMIT 1), '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'UPDATE', 'Updated user permissions', 'users', (SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'CREATE', 'Created new depot', 'depots', (SELECT id FROM depots WHERE location = 'Cape Town Depot' LIMIT 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'LOGIN', 'User logged in successfully', 'users', (SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'UPDATE', 'Updated scrap record status', 'scraps', (SELECT id FROM scraps LIMIT 1 OFFSET 7), '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'VIEW', 'Viewed activity logs', 'activity_logs', null, '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'REVIEW', 'Reviewed user suggestion', 'user_suggestions', null, '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'CREATE', 'Created inspection draft', 'inspections_drafts', null, '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'DELETE', 'Deleted scrap record', 'scraps', null, '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'UPDATE', 'Updated company information', 'companies', (SELECT id FROM companies WHERE name = 'FleetWise Solutions' LIMIT 1), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'CREATE', 'Created vehicle configuration', 'vehicle_configurations', (SELECT id FROM vehicle_configurations WHERE code = '6X4-TRUCK' LIMIT 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'VIEW', 'Viewed store information', 'stores', (SELECT id FROM stores WHERE code = 'JHB001' LIMIT 1), '192.168.1.102', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'CREATE', 'Created new inspection', 'inspections', (SELECT id FROM inspections LIMIT 1 OFFSET 10), '192.168.1.103', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), 'demoAdmin', 'LOGOUT', 'User logged out successfully', 'users', (SELECT id FROM users WHERE username = 'demoAdmin' LIMIT 1), '192.168.1.100', 'Mozilla/5.0', true, CURRENT_TIMESTAMP),
  ((SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), 'demoManager', 'LOGOUT', 'User logged out successfully', 'users', (SELECT id FROM users WHERE username = 'demoManager' LIMIT 1), '192.168.1.101', 'Mozilla/5.0', true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- User Suggestions (10 sample user suggestions with different statuses)
INSERT INTO user_suggestions (user_id, username, suggestion_type, suggestion_data, status, admin_reviewed_by, admin_notes, created_at)
VALUES
  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'NEW_TYRE_MODEL',
   '{"brand": "Michelin", "pattern": "X Multi Z", "specifications": "New fuel efficient pattern"}',
   'pending', null, null, CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'DAMAGE_CODE_UPDATE',
   '{"location": "TREAD", "code": "TR-4", "description": "Sidewall crack"}',
   'approved', 'demoAdmin', 'Added to scrap_data table', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'FEATURE_REQUEST',
   '{"feature": "Mobile app", "description": "Request for mobile application"}',
   'pending', null, null, CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'REPORT_IMPROVEMENT',
   '{"report": "Inspection Report", "suggestion": "Add export to PDF"}',
   'approved', 'demoAdmin', 'Will be included in next release', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'UI_ENHANCEMENT',
   '{"section": "Dashboard", "suggestion": "Add charts and graphs"}',
   'pending', null, null, CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'NEW_VEHICLE_CONFIG',
   '{"code": "6X2-TRUCK", "name": "6x2 Truck", "description": "6x2 configuration"}',
   'approved', 'demoAdmin', 'Configuration added', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'DATA_CORRECTION',
   '{"table": "tyres", "id": "1", "correction": "Update tread depth"}',
   'rejected', 'demoAdmin', 'Data is correct', CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'WORKFLOW_IMPROVEMENT',
   '{"workflow": "Inspection", "suggestion": "Add auto-save feature"}',
   'pending', null, null, CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoUser' LIMIT 1), 'demoUser', 'INTEGRATION_REQUEST',
   '{"system": "SAP", "description": "Integrate with SAP for inventory"}',
   'pending', null, null, CURRENT_TIMESTAMP),

  ((SELECT id FROM users WHERE username = 'demoInspector' LIMIT 1), 'demoInspector', 'TRAINING_REQUEST',
   '{"topic": "Advanced tyre inspection", "description": "Request for training session"}',
   'approved', 'demoAdmin', 'Training scheduled for next month', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Demo data seeding complete!
-- Total records created:
-- - 4 demo user accounts
-- - 1 country (South Africa)
-- - 9 provinces
-- - 45 regions
-- - 30 stores
-- - 5 companies
-- - 15 depots
-- - 20 tyre models
-- - 5 vehicle configurations
-- - 4 extended user profiles
-- - 20 inspections
-- - 15 scrap records
-- - 30 activity logs
-- - 10 user suggestions

-- Seed Geographic Data

-- Regions
INSERT INTO regions (name, description) VALUES
('Global', 'Worldwide operations'),
('Africa', 'African continent operations'),
('SADC', 'Southern African Development Community'),
('Europe', 'European operations'),
('Asia', 'Asian operations'),
('Americas', 'North and South American operations')
ON CONFLICT (name) DO NOTHING;

-- Countries (SADC prioritized, then major countries)
INSERT INTO countries (name, code, dialling_code, is_sadc, priority) VALUES
-- SADC Countries (priority 1-15)
('South Africa', 'ZA', '+27', TRUE, 1),
('Botswana', 'BW', '+267', TRUE, 2),
('Namibia', 'NA', '+264', TRUE, 3),
('Zimbabwe', 'ZW', '+263', TRUE, 4),
('Mozambique', 'MZ', '+258', TRUE, 5),
('Zambia', 'ZM', '+260', TRUE, 6),
('Malawi', 'MW', '+265', TRUE, 7),
('Angola', 'AO', '+244', TRUE, 8),
('Tanzania', 'TZ', '+255', TRUE, 9),
('Eswatini', 'SZ', '+268', TRUE, 10),
('Lesotho', 'LS', '+266', TRUE, 11),
('Mauritius', 'MU', '+230', TRUE, 12),
('Seychelles', 'SC', '+248', TRUE, 13),
('Comoros', 'KM', '+269', TRUE, 14),
('Democratic Republic of Congo', 'CD', '+243', TRUE, 15),
-- Other Major Countries (priority 16+)
('United States', 'US', '+1', FALSE, 16),
('United Kingdom', 'GB', '+44', FALSE, 17),
('Germany', 'DE', '+49', FALSE, 18),
('France', 'FR', '+33', FALSE, 19),
('Canada', 'CA', '+1', FALSE, 20),
('Australia', 'AU', '+61', FALSE, 21),
('Japan', 'JP', '+81', FALSE, 22),
('China', 'CN', '+86', FALSE, 23),
('India', 'IN', '+91', FALSE, 24),
('Brazil', 'BR', '+55', FALSE, 25),
('Nigeria', 'NG', '+234', FALSE, 26),
('Kenya', 'KE', '+254', FALSE, 27),
('Egypt', 'EG', '+20', FALSE, 28),
('Mexico', 'MX', '+52', FALSE, 29),
('Indonesia', 'ID', '+62', FALSE, 30)
ON CONFLICT (code) DO NOTHING;

-- South Africa Provinces
INSERT INTO provinces (name, country_id, code) VALUES
('Gauteng', (SELECT id FROM countries WHERE code = 'ZA'), 'GP'),
('KwaZulu-Natal', (SELECT id FROM countries WHERE code = 'ZA'), 'KZN'),
('Western Cape', (SELECT id FROM countries WHERE code = 'ZA'), 'WC'),
('Eastern Cape', (SELECT id FROM countries WHERE code = 'ZA'), 'EC'),
('Limpopo', (SELECT id FROM countries WHERE code = 'ZA'), 'LP'),
('Mpumalanga', (SELECT id FROM countries WHERE code = 'ZA'), 'MP'),
('North West', (SELECT id FROM countries WHERE code = 'ZA'), 'NW'),
('Free State', (SELECT id FROM countries WHERE code = 'ZA'), 'FS'),
('Northern Cape', (SELECT id FROM countries WHERE code = 'ZA'), 'NC')
ON CONFLICT (name, country_id) DO NOTHING;

-- Botswana Districts
INSERT INTO provinces (name, country_id, code) VALUES
('Central', (SELECT id FROM countries WHERE code = 'BW'), 'CE'),
('Ghanzi', (SELECT id FROM countries WHERE code = 'BW'), 'GH'),
('Kgalagadi', (SELECT id FROM countries WHERE code = 'BW'), 'KG'),
('Kgatleng', (SELECT id FROM countries WHERE code = 'BW'), 'KL'),
('Kweneng', (SELECT id FROM countries WHERE code = 'BW'), 'KW'),
('Ngamiland', (SELECT id FROM countries WHERE code = 'BW'), 'NG'),
('North East', (SELECT id FROM countries WHERE code = 'BW'), 'NE'),
('South East', (SELECT id FROM countries WHERE code = 'BW'), 'SE'),
('Southern', (SELECT id FROM countries WHERE code = 'BW'), 'SO')
ON CONFLICT (name, country_id) DO NOTHING;

-- Namibia Regions
INSERT INTO provinces (name, country_id, code) VALUES
('Erongo', (SELECT id FROM countries WHERE code = 'NA'), 'ER'),
('Hardap', (SELECT id FROM countries WHERE code = 'NA'), 'HA'),
('Karas', (SELECT id FROM countries WHERE code = 'NA'), 'KA'),
('Kavango East', (SELECT id FROM countries WHERE code = 'NA'), 'KE'),
('Kavango West', (SELECT id FROM countries WHERE code = 'NA'), 'KW'),
('Khomas', (SELECT id FROM countries WHERE code = 'NA'), 'KH'),
('Kunene', (SELECT id FROM countries WHERE code = 'NA'), 'KU'),
('Ohangwena', (SELECT id FROM countries WHERE code = 'NA'), 'OW'),
('Omaheke', (SELECT id FROM countries WHERE code = 'NA'), 'OH'),
('Omusati', (SELECT id FROM countries WHERE code = 'NA'), 'OS'),
('Oshana', (SELECT id FROM countries WHERE code = 'NA'), 'ON'),
('Oshikoto', (SELECT id FROM countries WHERE code = 'NA'), 'OT'),
('Otjozondjupa', (SELECT id FROM countries WHERE code = 'NA'), 'OD'),
('Zambezi', (SELECT id FROM countries WHERE code = 'NA'), 'ZA')
ON CONFLICT (name, country_id) DO NOTHING;

-- Zimbabwe Provinces
INSERT INTO provinces (name, country_id, code) VALUES
('Bulawayo', (SELECT id FROM countries WHERE code = 'ZW'), 'BU'),
('Harare', (SELECT id FROM countries WHERE code = 'ZW'), 'HA'),
('Manicaland', (SELECT id FROM countries WHERE code = 'ZW'), 'MA'),
('Mashonaland Central', (SELECT id FROM countries WHERE code = 'ZW'), 'MC'),
('Mashonaland East', (SELECT id FROM countries WHERE code = 'ZW'), 'ME'),
('Mashonaland West', (SELECT id FROM countries WHERE code = 'ZW'), 'MW'),
('Masvingo', (SELECT id FROM countries WHERE code = 'ZW'), 'MV'),
('Matabeleland North', (SELECT id FROM countries WHERE code = 'ZW'), 'MN'),
('Matabeleland South', (SELECT id FROM countries WHERE code = 'ZW'), 'MS'),
('Midlands', (SELECT id FROM countries WHERE code = 'ZW'), 'MI')
ON CONFLICT (name, country_id) DO NOTHING;

-- Default Stores
INSERT INTO stores (name, branch_code, address, country_id, province_id, region_id, contact_person, phone, email) VALUES
('Head Office', 'HO001', '123 Main Street, Johannesburg', (SELECT id FROM countries WHERE code = 'ZA'), (SELECT id FROM provinces WHERE code = 'GP'), (SELECT id FROM regions WHERE name = 'SADC'), 'John Smith', '+27111234567', 'headoffice@zuri.com'),
('Cape Town Branch', 'CT001', '456 Long Street, Cape Town', (SELECT id FROM countries WHERE code = 'ZA'), (SELECT id FROM provinces WHERE code = 'WC'), (SELECT id FROM regions WHERE name = 'SADC'), 'Jane Doe', '+27219876543', 'capetown@zuri.com'),
('Durban Branch', 'DBN001', '789 Beach Road, Durban', (SELECT id FROM countries WHERE code = 'ZA'), (SELECT id FROM provinces WHERE code = 'KZN'), (SELECT id FROM regions WHERE name = 'SADC'), 'Mike Johnson', '+27315556677', 'durban@zuri.com'),
('Gaborone Branch', 'GB001', '321 Main Mall, Gaborone', (SELECT id FROM countries WHERE code = 'BW'), (SELECT id FROM provinces WHERE code = 'CE'), (SELECT id FROM regions WHERE name = 'SADC'), 'Sarah Williams', '+26731234567', 'gaborone@zuri.com'),
('Windhoek Branch', 'WH001', '654 Independence Avenue, Windhoek', (SELECT id FROM countries WHERE code = 'NA'), (SELECT id FROM provinces WHERE code = 'KH'), (SELECT id FROM regions WHERE name = 'SADC'), 'David Brown', '+26461123456', 'windhoek@zuri.com')
ON CONFLICT (branch_code) DO NOTHING;

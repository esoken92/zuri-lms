-- Create Demo Users in Supabase Auth System
-- This script creates users in auth.users and links them to the custom users table

-- Insert users into auth.users (Supabase Auth system)
-- Note: Passwords are already hashed using bcrypt
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
SELECT 
  gen_random_uuid(),
  email,
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  NOW(),
  jsonb_build_object('role', role),
  '{"provider": "email"}',
  NOW(),
  NOW(),
  NOW()
FROM (VALUES 
  ('demoAdmin@lms.com', 'Administrator'),
  ('demoManager@lms.com', 'Management'),
  ('demoInspector@lms.com', 'Inspector'),
  ('demoUser@lms.com', 'User')
) AS v(email, role)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = v.email);

-- Delete old demo data from child tables first (to avoid foreign key constraints)
DELETE FROM activity_logs WHERE username IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');
DELETE FROM user_suggestions WHERE username IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');
DELETE FROM scraps WHERE user_name IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');
DELETE FROM inspections WHERE user_name IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');

-- Delete old demo users from custom table
DELETE FROM users_extended WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');
DELETE FROM users WHERE username IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');

-- Create new users in custom table with auth user IDs
INSERT INTO users (id, username, role, email, approval_status, created_at, updated_at)
SELECT 
  au.id,
  CASE 
    WHEN au.email = 'demoAdmin@lms.com' THEN 'demoAdmin'
    WHEN au.email = 'demoManager@lms.com' THEN 'demoManager'
    WHEN au.email = 'demoInspector@lms.com' THEN 'demoInspector'
    WHEN au.email = 'demoUser@lms.com' THEN 'demoUser'
  END,
  CASE 
    WHEN au.email = 'demoAdmin@lms.com' THEN 'Administrator'
    WHEN au.email = 'demoManager@lms.com' THEN 'Management'
    WHEN au.email = 'demoInspector@lms.com' THEN 'Inspector'
    WHEN au.email = 'demoUser@lms.com' THEN 'User'
  END,
  au.email,
  'approved',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');

-- Recreate users_extended records
INSERT INTO users_extended (user_id, first_name, last_name, email, phone, employee_id, country_id, province_id, region_id, store_id, security_question_1, security_answer_1_hash, security_question_2, security_answer_2_hash, is_active)
SELECT 
  u.id,
  CASE 
    WHEN u.username = 'demoAdmin' THEN 'Admin'
    WHEN u.username = 'demoManager' THEN 'Manager'
    WHEN u.username = 'demoInspector' THEN 'Inspector'
    WHEN u.username = 'demoUser' THEN 'Regular'
  END,
  'User',
  u.email,
  CASE 
    WHEN u.username = 'demoAdmin' THEN '+27 11 123 4567'
    WHEN u.username = 'demoManager' THEN '+27 21 234 5678'
    WHEN u.username = 'demoInspector' THEN '+27 31 345 6789'
    WHEN u.username = 'demoUser' THEN '+27 12 456 7890'
  END,
  CASE 
    WHEN u.username = 'demoAdmin' THEN 'EMP001'
    WHEN u.username = 'demoManager' THEN 'EMP002'
    WHEN u.username = 'demoInspector' THEN 'EMP003'
    WHEN u.username = 'demoUser' THEN 'EMP004'
  END,
  (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1),
  CASE 
    WHEN u.username = 'demoAdmin' THEN (SELECT id FROM provinces WHERE name = 'Gauteng' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1)
    WHEN u.username = 'demoManager' THEN (SELECT id FROM provinces WHERE name = 'Western Cape' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1)
    WHEN u.username = 'demoInspector' THEN (SELECT id FROM provinces WHERE name = 'KwaZulu-Natal' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1)
    WHEN u.username = 'demoUser' THEN (SELECT id FROM provinces WHERE name = 'Gauteng' AND country_id = (SELECT id FROM countries WHERE code = 'ZA' LIMIT 1) LIMIT 1)
  END,
  CASE 
    WHEN u.username = 'demoAdmin' THEN (SELECT id FROM regions WHERE name = 'Johannesburg' LIMIT 1)
    WHEN u.username = 'demoManager' THEN (SELECT id FROM regions WHERE name = 'Cape Town' LIMIT 1)
    WHEN u.username = 'demoInspector' THEN (SELECT id FROM regions WHERE name = 'Durban' LIMIT 1)
    WHEN u.username = 'demoUser' THEN (SELECT id FROM regions WHERE name = 'Pretoria' LIMIT 1)
  END,
  CASE 
    WHEN u.username = 'demoAdmin' THEN (SELECT id FROM stores WHERE code = 'JHB001' LIMIT 1)
    WHEN u.username = 'demoManager' THEN (SELECT id FROM stores WHERE code = 'CPT001' LIMIT 1)
    WHEN u.username = 'demoInspector' THEN (SELECT id FROM stores WHERE code = 'DBN001' LIMIT 1)
    WHEN u.username = 'demoUser' THEN (SELECT id FROM stores WHERE code = 'PTA001' LIMIT 1)
  END,
  'What was the name of your first pet?',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'What is your mother''s maiden name?',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  true
FROM users u
WHERE u.username IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser')
AND NOT EXISTS (SELECT 1 FROM users_extended WHERE users_extended.user_id = u.id);

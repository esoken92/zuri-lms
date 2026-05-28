-- Create demo users using Supabase SQL functions
-- This uses the auth.users table directly with a workaround for password hashing

-- First, check what users already exist
SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE 'demo%@lms.com';

-- Delete existing demo users to start fresh
DELETE FROM users_extended WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');
DELETE FROM users WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');
DELETE FROM auth.users WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');

-- Note: We cannot directly insert into auth.users with proper password hashes via SQL
-- because Supabase uses PBKDF2 with a server-side secret for password hashing.
-- Instead, we'll create users with empty passwords and use the password reset flow.

-- Insert users with placeholder password hashes
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
SELECT 
  gen_random_uuid(),
  email,
  '', -- Empty password - will need to be set via reset
  NOW(),
  role_json,
  '{"provider": "email"}',
  NOW(),
  NOW(),
  NOW()
FROM (VALUES 
  ('demoAdmin@lms.com', '{"role": "Administrator"}'::jsonb),
  ('demoManager@lms.com', '{"role": "Management"}'::jsonb),
  ('demoInspector@lms.com', '{"role": "Inspector"}'::jsonb),
  ('demoUser@lms.com', '{"role": "User"}'::jsonb)
) AS v(email, role_json);

-- Create corresponding users in custom table
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

-- Show created users
SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE 'demo%@lms.com';

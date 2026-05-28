-- Create demo users directly in auth.users table
-- This bypasses the API rate limits by using direct SQL
-- Note: We'll use a simple approach - create users with known passwords

-- First, delete any existing demo users to avoid conflicts
DELETE FROM users_extended WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');
DELETE FROM users WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');
DELETE FROM auth.users WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');

-- Insert users into auth.users with empty password (will be set via reset)
-- We'll use the Supabase auth system's password reset mechanism
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
VALUES 
  (gen_random_uuid(), 'demoAdmin@lms.com', '', NOW(), '{"role": "Administrator"}', '{"provider": "email"}', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'demoManager@lms.com', '', NOW(), '{"role": "Management"}', '{"provider": "email"}', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'demoInspector@lms.com', '', NOW(), '{"role": "Inspector"}', '{"provider": "email"}', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'demoUser@lms.com', '', NOW(), '{"role": "User"}', '{"provider": "email"}', NOW(), NOW(), NOW());

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

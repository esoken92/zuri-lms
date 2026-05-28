-- Sync demo users from auth.users to public.users with correct roles

-- Delete existing demo users from public.users
DELETE FROM users WHERE email IN ('demoadmin@lms.com', 'demomanager@lms.com', 'demoinspector@lms.com', 'demouser@lms.com');

-- Insert demo users with correct roles
INSERT INTO users (id, username, role, email, approval_status, password_hash, created_at, updated_at)
SELECT 
  au.id,
  CASE 
    WHEN au.email = 'demoadmin@lms.com' THEN 'demoAdmin'
    WHEN au.email = 'demomanager@lms.com' THEN 'demoManager'
    WHEN au.email = 'demoinspector@lms.com' THEN 'demoInspector'
    WHEN au.email = 'demouser@lms.com' THEN 'demoUser'
  END as username,
  CASE 
    WHEN au.email = 'demoadmin@lms.com' THEN 'Administrator'
    WHEN au.email = 'demomanager@lms.com' THEN 'Management'
    WHEN au.email = 'demoinspector@lms.com' THEN 'Inspector'
    WHEN au.email = 'demouser@lms.com' THEN 'User'
  END as role,
  au.email,
  'approved',
  au.encrypted_password,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN ('demoadmin@lms.com', 'demomanager@lms.com', 'demoinspector@lms.com', 'demouser@lms.com');

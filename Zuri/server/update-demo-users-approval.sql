-- Update demo users to approved status
-- This script sets approval_status to 'approved' for demo users

-- First, delete old demo users from custom table
DELETE FROM users WHERE username IN ('demoAdmin', 'demoManager', 'demoInspector', 'demoUser');

WITH demo_auth_users AS (
  SELECT 
    id,
    email,
    CASE 
      WHEN email = 'demoAdmin@lms.com' THEN 'demoAdmin'
      WHEN email = 'demoManager@lms.com' THEN 'demoManager'
      WHEN email = 'demoInspector@lms.com' THEN 'demoInspector'
      WHEN email = 'demoUser@lms.com' THEN 'demoUser'
    END as username,
    CASE 
      WHEN email = 'demoAdmin@lms.com' THEN 'Administrator'
      WHEN email = 'demoManager@lms.com' THEN 'Management'
      WHEN email = 'demoInspector@lms.com' THEN 'Inspector'
      WHEN email = 'demoUser@lms.com' THEN 'User'
    END as role
  FROM auth.users
  WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com')
)

-- Insert new users
INSERT INTO users (id, username, role, email, approval_status, created_at, updated_at)
SELECT 
  dau.id,
  dau.username,
  dau.role,
  dau.email,
  'approved',
  NOW(),
  NOW()
FROM demo_auth_users dau;

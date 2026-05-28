-- Confirm email addresses for demo users
-- This sets email_confirmed_at to NOW() for all demo users

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('demoAdmin@lms.com', 'demoManager@lms.com', 'demoInspector@lms.com', 'demoUser@lms.com');

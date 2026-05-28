-- Create demo users in auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
SELECT 
  gen_random_uuid(),
  email,
  '',
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

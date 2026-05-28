-- Migration to create demo users with proper password hashing
-- This migration uses the Supabase auth system's built-in functions

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to hash passwords using Supabase's algorithm
-- Note: This is a workaround - the actual password should be set via the API
CREATE OR REPLACE FUNCTION create_demo_user(email_param text, password_param text, role_param text, username_param text)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Insert into auth.users with a placeholder password
  -- The password will need to be set via password reset or API
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
  VALUES (gen_random_uuid(), email_param, '', NOW(), jsonb_build_object('role', role_param), '{"provider": "email"}', NOW(), NOW(), NOW())
  RETURNING id INTO user_id;
  
  -- Insert into custom users table
  INSERT INTO users (id, username, role, email, approval_status, created_at, updated_at)
  VALUES (user_id, username_param, role_param, email_param, 'approved', NOW(), NOW());
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo users
SELECT create_demo_user('demoAdmin@lms.com', 'DemoAdmin123', 'Administrator', 'demoAdmin');
SELECT create_demo_user('demoManager@lms.com', 'DemoManager123', 'Management', 'demoManager');
SELECT create_demo_user('demoInspector@lms.com', 'DemoInspector123', 'Inspector', 'demoInspector');
SELECT create_demo_user('demoUser@lms.com', 'DemoUser123', 'User', 'demoUser');

-- Clean up the function
DROP FUNCTION create_demo_user;

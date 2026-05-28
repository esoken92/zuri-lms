#!/bin/bash

# Create demo users using Supabase CLI
# This script uses the CLI's built-in auth management

echo "Creating demo users..."

# Login to Supabase (if not already logged in)
# supabase login

# Create users using the CLI's database query with auth functions
# We'll use a workaround by creating users with temporary passwords
# that can be changed later

supabase db query --linked "
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at)
SELECT 
  gen_random_uuid(),
  email,
  '', -- Empty password - will be set via reset
  NOW(),
  role_json,
  '{\"provider\": \"email\"}',
  NOW(),
  NOW(),
  NOW()
FROM (VALUES 
  ('demoAdmin@lms.com', '{\"role\": \"Administrator\"}'::jsonb),
  ('demoManager@lms.com', '{\"role\": \"Management\"}'::jsonb),
  ('demoInspector@lms.com', '{\"role\": \"Inspector\"}'::jsonb),
  ('demoUser@lms.com', '{\"role\": \"User\"}'::jsonb)
) AS v(email, role_json);
"

echo "Users created in auth.users"
echo "Now syncing to custom users table..."

supabase db query --linked --file ../server/update-demo-users-approval.sql

echo "Done. Users need password reset to set actual passwords."

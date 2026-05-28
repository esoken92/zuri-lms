#!/bin/bash

# Load environment variables
export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL ../client-new/.env | cut -d '=' -f2)
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY ../client-new/.env | cut -d '=' -f2)

echo "Creating demo users via Supabase Management API..."
echo "URL: $SUPABASE_URL"

# Function to create user
create_user() {
  local email=$1
  local password=$2
  local role=$3
  
  echo "Creating user: $email"
  
  curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"email_confirm\": true,
      \"user_metadata\": {\"role\": \"$role\"}
    }"
  
  echo ""
  echo "Waiting 2 seconds..."
  sleep 2
}

# Create demo users
create_user "demoAdmin@lms.com" "DemoAdmin123" "Administrator"
create_user "demoManager@lms.com" "DemoManager123" "Management"
create_user "demoInspector@lms.com" "DemoInspector123" "Inspector"
create_user "demoUser@lms.com" "DemoUser123" "User"

echo "Users created. Now syncing to custom users table..."

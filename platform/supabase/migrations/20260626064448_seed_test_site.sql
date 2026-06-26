-- Seed test organization and site for data migration
-- This creates a default organization and site that can be used for the Tyre Sync data migration

-- First, insert a test organization (using Clerk organization ID format)
INSERT INTO platform.organizations (id, name, slug, created_at, updated_at)
VALUES (
  'org_test_placeholder',
  'Test Organization',
  'test-org',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Then, insert a test site linked to the organization
INSERT INTO platform.sites (id, org_id, name, address, city, country, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'org_test_placeholder',
  'Default Site',
  '123 Main Street',
  'Johannesburg',
  'South Africa',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

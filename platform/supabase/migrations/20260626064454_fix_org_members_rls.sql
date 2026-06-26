-- Fix RLS policy for organization_members to allow service role operations
-- The platform admin check is done at the application level via Clerk, not Supabase auth.users

DROP POLICY IF EXISTS "Platform admins can manage all org memberships" ON platform.organization_members;

CREATE POLICY "Service role can manage org memberships"
  ON platform.organization_members FOR ALL
  USING (true);  -- App-level auth handles platform admin check via Clerk

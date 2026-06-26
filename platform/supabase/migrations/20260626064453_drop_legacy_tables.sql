-- ============================================================
-- Drop Legacy Public Schema Tables After Migration
-- Run this AFTER the migration completes successfully
-- ============================================================

-- Disable RLS on legacy tables before dropping (to clear linter warnings)
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.depots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tyres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_extended DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_configurations DISABLE ROW LEVEL SECURITY;

-- Drop legacy tables
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.depots CASCADE;
DROP TABLE IF EXISTS public.inspections_drafts CASCADE;
DROP TABLE IF EXISTS public.provinces CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;
DROP TABLE IF EXISTS public.scrap_data CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.tyres CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.users_extended CASCADE;
DROP TABLE IF EXISTS public.vehicle_configs CASCADE;
DROP TABLE IF EXISTS public.vehicle_configurations CASCADE;

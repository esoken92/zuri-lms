-- Supabase Database Migration for Zuri LMS
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (will be integrated with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Will be deprecated when using Supabase Auth
  role TEXT NOT NULL DEFAULT 'User',
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  browser_version TEXT,
  device TEXT,
  device_type TEXT,
  os TEXT,
  os_version TEXT,
  language TEXT,
  languages TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  timezone TEXT,
  platform TEXT,
  cookie_enabled BOOLEAN,
  do_not_track TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  session_duration INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  table_name TEXT,
  record_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  request_data JSONB,
  response_data JSONB,
  error_code TEXT,
  error_message TEXT,
  success BOOLEAN DEFAULT true,
  client_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  company_id UUID,
  depot_id UUID,
  inspection_date DATE,
  location TEXT,
  header TEXT,
  vehicles JSONB,
  timestamp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections drafts table
CREATE TABLE IF NOT EXISTS inspections_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  header TEXT,
  vehicles JSONB,
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draft_id, user_id)
);

-- User drafts table
CREATE TABLE IF NOT EXISTS user_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_name TEXT NOT NULL,
  draft_data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrap data reference table
CREATE TABLE IF NOT EXISTS scrap_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT NOT NULL,
  damage_code TEXT NOT NULL,
  damage_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location, damage_code)
);

-- Scraps table
CREATE TABLE IF NOT EXISTS scraps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  store_id UUID,
  items JSONB,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Depots table
CREATE TABLE IF NOT EXISTS depots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tyres table
CREATE TABLE IF NOT EXISTS tyres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT,
  pattern TEXT,
  ply_rating TEXT,
  original_tread_depth TEXT,
  load_rating TEXT,
  load_rating_duals TEXT,
  load_rating_singles TEXT,
  speed_rating_duals TEXT,
  speed_rating_singles TEXT,
  tube_rating TEXT,
  nominal_section_width TEXT,
  aspect_ratio TEXT,
  rim_size TEXT,
  product_code TEXT,
  depth_inner NUMERIC,
  depth_middle NUMERIC,
  depth_outer NUMERIC,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand, pattern, nominal_section_width, aspect_ratio, rim_size)
);

-- Vehicle configurations table
CREATE TABLE IF NOT EXISTS vehicle_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  axle_count INTEGER,
  tire_count INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle configs table
CREATE TABLE IF NOT EXISTS vehicle_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE,
  name TEXT,
  tire_config JSONB,
  tire_sizes JSONB,
  ideal_pressures JSONB,
  pressure_units TEXT,
  spares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User suggestions table
CREATE TABLE IF NOT EXISTS user_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  suggestion_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_reviewed_by TEXT,
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geographic data tables for user management
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  is_sadc BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, country_id)
);

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, province_id)
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extended users table with geographic and profile data
CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  employee_id TEXT UNIQUE,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  security_question_1 TEXT NOT NULL,
  security_answer_1_hash TEXT NOT NULL,
  security_question_2 TEXT NOT NULL,
  security_answer_2_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at);
CREATE INDEX IF NOT EXISTS idx_scraps_user_id ON scraps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_status ON user_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_user_id ON user_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- RLS Policies for inspections
-- Users can read their own inspections
CREATE POLICY "Users can view own inspections" ON inspections
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create inspections
CREATE POLICY "Users can create inspections" ON inspections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own inspections
CREATE POLICY "Users can update own inspections" ON inspections
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all inspections
CREATE POLICY "Admins can view all inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- RLS Policies for scraps
CREATE POLICY "Users can view own scraps" ON scraps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create scraps" ON scraps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraps" ON scraps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scraps" ON scraps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- RLS Policies for user_drafts
CREATE POLICY "Users can view own drafts" ON user_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create drafts" ON user_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON user_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON user_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_suggestions
CREATE POLICY "Users can view own suggestions" ON user_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create suggestions" ON user_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" ON user_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suggestions" ON user_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update suggestions" ON user_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Seed scrap_data table
INSERT INTO scrap_data (location, damage_code, damage_description) VALUES
  ('TREAD', 'TR-1', 'Puncture/Cut (To Interior)'),
  ('TREAD', 'TR-2', 'Puncture/Cut (Not To Interior)'),
  ('TREAD', 'TR-3', 'Chipping/Chunking'),
  ('SHOULDER', 'SH-1', 'Puncture/Cut (To Interior)'),
  ('SIDEWALL', 'SW-1', 'Puncture/Cut (To Interior)'),
  ('BEAD', 'BD-1', 'Cut'),
  ('INTERIOR', 'IN-1', 'Cut'),
  ('GENERAL', 'GN-1', 'Improper Repair')
ON CONFLICT (location, damage_code) DO NOTHING;

-- Seed tyres table
INSERT INTO tyres (brand, pattern, ply_rating, original_tread_depth, load_rating, load_rating_duals, load_rating_singles, speed_rating_duals, speed_rating_singles, tube_rating, nominal_section_width, aspect_ratio, rim_size) VALUES
  ('Michelin', 'X Multi HDD', '18PR', '22.5', '156/150', '156', '150', 'K', 'L', 'TL', '315', '65', '22.5'),
  ('Bridgestone', 'M840', '16PR', '16.5', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5')
ON CONFLICT (brand, pattern, nominal_section_width, aspect_ratio, rim_size) DO NOTHING;

-- Seed countries
INSERT INTO countries (name, code, is_sadc) VALUES
  ('South Africa', 'ZA', true),
  ('Botswana', 'BW', true),
  ('Namibia', 'NA', true),
  ('Zimbabwe', 'ZW', true),
  ('Mozambique', 'MZ', true),
  ('Lesotho', 'LS', true),
  ('Eswatini', 'SZ', true)
ON CONFLICT (name) DO NOTHING;

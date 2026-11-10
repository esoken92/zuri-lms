-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'inspector', 'manager')),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  table_name TEXT,
  record_id UUID,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  company_id UUID,
  depot_id UUID,
  inspection_date DATE NOT NULL,
  location TEXT,
  header JSONB NOT NULL,
  vehicles JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection drafts (autosave)
CREATE TABLE IF NOT EXISTS inspections_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  header JSONB,
  vehicles JSONB,
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User drafts (for offline sync)
CREATE TABLE IF NOT EXISTS user_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_name TEXT,
  draft_data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraps
CREATE TABLE IF NOT EXISTS scraps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  store_id UUID,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrap reference data
CREATE TABLE IF NOT EXISTS scrap_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT NOT NULL,
  damage_code TEXT NOT NULL,
  damage_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tyres inventory
CREATE TABLE IF NOT EXISTS tyres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT,
  pattern TEXT,
  ply_rating TEXT,
  tread_depth DECIMAL(5, 2),
  load_rating TEXT,
  speed_rating TEXT,
  tube_rating TEXT,
  section_width TEXT,
  aspect_ratio TEXT,
  rim_size TEXT,
  product_code TEXT UNIQUE,
  depth_inner DECIMAL(5, 2),
  depth_middle DECIMAL(5, 2),
  depth_outer DECIMAL(5, 2),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Depots
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

-- Vehicle configurations
CREATE TABLE IF NOT EXISTS vehicle_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  axle_count INTEGER NOT NULL,
  tire_count INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle configs (detailed)
CREATE TABLE IF NOT EXISTS vehicle_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tire_config JSONB NOT NULL,
  tire_sizes JSONB NOT NULL,
  ideal_pressures JSONB NOT NULL,
  pressure_units TEXT DEFAULT 'psi',
  spares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User suggestions
CREATE TABLE IF NOT EXISTS user_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  suggestion_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  admin_reviewed_by UUID REFERENCES users(id),
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_sadc BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provinces
CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regions
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users extended profile
CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  employee_id TEXT UNIQUE,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  security_question_1 TEXT,
  security_answer_1_hash TEXT,
  security_question_2 TEXT,
  security_answer_2_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_drafts_user_id ON inspections_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_sync_status ON user_drafts(sync_status);
CREATE INDEX IF NOT EXISTS idx_scraps_user_id ON scraps(user_id);
CREATE INDEX IF NOT EXISTS idx_scraps_status ON scraps(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_users_extended_store_id ON users_extended(store_id);
CREATE INDEX IF NOT EXISTS idx_depots_company_id ON depots(company_id);
CREATE INDEX IF NOT EXISTS idx_stores_region_id ON stores(region_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrap_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tyres ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read their own data, admins can do everything
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User sessions: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Activity logs: Users can view their own logs, admins can view all
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Inspections: Users can view their own inspections, admins can view all
CREATE POLICY "Users can view own inspections" ON inspections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own inspections" ON inspections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own inspections" ON inspections
  FOR UPDATE USING (user_id = auth.uid());

-- Inspection drafts: Users can manage their own drafts
CREATE POLICY "Users can manage own inspection drafts" ON inspections_drafts
  FOR ALL USING (user_id = auth.uid());

-- User drafts: Users can manage their own drafts
CREATE POLICY "Users can manage own drafts" ON user_drafts
  FOR ALL USING (user_id = auth.uid());

-- Scraps: Users can view their own scraps, admins can view all
CREATE POLICY "Users can view own scraps" ON scraps
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all scraps" ON scraps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own scraps" ON scraps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scraps" ON scraps
  FOR UPDATE USING (user_id = auth.uid());

-- Scrap data: Public read access
CREATE POLICY "Public can view scrap data" ON scrap_data
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage scrap data" ON scrap_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tyres: Public read access, admins can manage
CREATE POLICY "Public can view tyres" ON tyres
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tyres" ON tyres
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Companies: Public read access, admins can manage
CREATE POLICY "Public can view companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Depots: Public read access, admins can manage
CREATE POLICY "Public can view depots" ON depots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage depots" ON depots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicle configurations: Public read access, admins can manage
CREATE POLICY "Public can view vehicle configurations" ON vehicle_configurations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vehicle configurations" ON vehicle_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicle configs: Public read access, admins can manage
CREATE POLICY "Public can view vehicle configs" ON vehicle_configs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vehicle configs" ON vehicle_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User suggestions: Users can view own, admins can view all
CREATE POLICY "Users can view own suggestions" ON user_suggestions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all suggestions" ON user_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own suggestions" ON user_suggestions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update suggestions" ON user_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Countries: Public read access, admins can manage
CREATE POLICY "Public can view countries" ON countries
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage countries" ON countries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Provinces: Public read access, admins can manage
CREATE POLICY "Public can view provinces" ON provinces
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage provinces" ON provinces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Regions: Public read access, admins can manage
CREATE POLICY "Public can view regions" ON regions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage regions" ON regions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Stores: Public read access, admins can manage
CREATE POLICY "Public can view stores" ON stores
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stores" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users extended: Users can view own, admins can view all
CREATE POLICY "Users can view own extended profile" ON users_extended
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all extended profiles" ON users_extended
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own extended profile" ON users_extended
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage extended profiles" ON users_extended
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scrap_data_updated_at BEFORE UPDATE ON scrap_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tyres_updated_at BEFORE UPDATE ON tyres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_depots_updated_at BEFORE UPDATE ON depots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_configurations_updated_at BEFORE UPDATE ON vehicle_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_configs_updated_at BEFORE UPDATE ON vehicle_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_suggestions_updated_at BEFORE UPDATE ON user_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraps_updated_at BEFORE UPDATE ON scraps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON users_extended
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_drafts_updated_at BEFORE UPDATE ON user_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

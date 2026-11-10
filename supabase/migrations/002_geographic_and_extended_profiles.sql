-- Geographic Data Tables
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(3) NOT NULL UNIQUE,
  dialling_code VARCHAR(10),
  is_sadc BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provinces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, country_id)
);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  branch_code VARCHAR(20) UNIQUE,
  address TEXT,
  country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
  province_id INTEGER REFERENCES provinces(id) ON DELETE SET NULL,
  region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extended User Profile Fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS dialling_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS province_id INTEGER REFERENCES provinces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
ADD COLUMN IF NOT EXISTS security_question_1 TEXT,
ADD COLUMN IF NOT EXISTS security_answer_1 TEXT,
ADD COLUMN IF NOT EXISTS security_question_2 TEXT,
ADD COLUMN IF NOT EXISTS security_answer_2 TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_country_id ON users(country_id);
CREATE INDEX IF NOT EXISTS idx_users_province_id ON users(province_id);
CREATE INDEX IF NOT EXISTS idx_users_region_id ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_country_id ON stores(country_id);
CREATE INDEX IF NOT EXISTS idx_stores_province_id ON stores(province_id);
CREATE INDEX IF NOT EXISTS idx_stores_region_id ON stores(region_id);
CREATE INDEX IF NOT EXISTS idx_provinces_country_id ON provinces(country_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provinces_updated_at BEFORE UPDATE ON provinces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Regions: All authenticated users can read, only admins can write
CREATE POLICY "Regions are viewable by everyone"
    ON regions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert regions"
    ON regions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update regions"
    ON regions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Countries: All authenticated users can read, only admins can write
CREATE POLICY "Countries are viewable by everyone"
    ON countries FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert countries"
    ON countries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update countries"
    ON countries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Provinces: All authenticated users can read, only admins can write
CREATE POLICY "Provinces are viewable by everyone"
    ON provinces FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert provinces"
    ON provinces FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update provinces"
    ON provinces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Stores: All authenticated users can read, only admins can write
CREATE POLICY "Stores are viewable by everyone"
    ON stores FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert stores"
    ON stores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update stores"
    ON stores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Migration 001: Create scraps table
-- Run by server at startup if not present

CREATE TABLE IF NOT EXISTS "scraps" (
  id SERIAL PRIMARY KEY,
  brand_number TEXT,
  size TEXT,
  brand TEXT,
  pattern TEXT,
  dot TEXT,
  caps TEXT,
  retread_pattern TEXT,
  location_of_damage TEXT,
  reason_for_damage TEXT,
  photo_url TEXT,
  status TEXT,
  user_id INTEGER,
  user_name TEXT,
  store_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

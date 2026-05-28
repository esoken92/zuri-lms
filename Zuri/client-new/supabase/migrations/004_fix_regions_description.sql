-- Add description column to regions table if it doesn't exist
ALTER TABLE regions
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add code column to regions table if it doesn't exist
ALTER TABLE regions
ADD COLUMN IF NOT EXISTS code VARCHAR(10);

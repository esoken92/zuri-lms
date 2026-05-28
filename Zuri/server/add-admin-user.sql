-- Add admin user to the database
-- Username: admin
-- Password: admin
-- Role: Administrator

INSERT INTO users (username, password_hash, role, email, created_at, updated_at)
VALUES (
  'admin',
  '$2b$10$/WUYkEdghV0TfnvN24JS.uhITLomHV2nWQ7Qvtniz.8yBgipP9.L2',
  'Administrator',
  'admin@zuri.com',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = '$2b$10$/WUYkEdghV0TfnvN24JS.uhITLomHV2nWQ7Qvtniz.8yBgipP9.L2',
  role = 'Administrator',
  updated_at = CURRENT_TIMESTAMP;

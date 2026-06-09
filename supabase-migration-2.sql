-- Run this in Supabase > SQL Editor
-- Adds columns missing from podologist_config that the app requires

ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'PodologyApp';
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS business_address TEXT NOT NULL DEFAULT '';
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '';

-- Ensure config row exists
INSERT INTO podologist_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

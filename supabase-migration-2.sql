-- Run this in Supabase > SQL Editor
-- Adds columns missing from barber_config that the app requires

ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'BarberApp';
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS business_address TEXT NOT NULL DEFAULT '';
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '';

-- Ensure config row exists
INSERT INTO barber_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

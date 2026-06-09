-- Run this in Supabase SQL Editor

-- 1. Appointments: reschedule token + reminder tracking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_token TEXT UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_first_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_second_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. podologist_config: reschedule cutoff + reminder hours
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS reschedule_cutoff_hours INTEGER NOT NULL DEFAULT 2;
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS reminder_first_hours INTEGER NOT NULL DEFAULT 12;
ALTER TABLE podologist_config ADD COLUMN IF NOT EXISTS reminder_second_hours INTEGER NOT NULL DEFAULT 2;

-- 3. Ensure a config row exists with id=1 (insert if missing)
INSERT INTO podologist_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

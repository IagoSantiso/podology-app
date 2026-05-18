-- ============================================================
-- BarberApp — Migración completa
-- Pegar en Supabase > SQL Editor y ejecutar
-- Seguro ejecutar varias veces (IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. Citas: token de reagendado + seguimiento de recordatorios
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_token TEXT UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_first_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_second_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. barber_config: columnas de configuración extendida
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS reschedule_cutoff_hours INTEGER NOT NULL DEFAULT 2;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS reminder_first_hours INTEGER NOT NULL DEFAULT 12;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS reminder_second_hours INTEGER NOT NULL DEFAULT 2;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'BarberApp';
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS business_address TEXT NOT NULL DEFAULT '';
ALTER TABLE barber_config ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '';

-- 3. Asegura que existe la fila de configuración
INSERT INTO barber_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

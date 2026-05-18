-- Añadir pausa de comida a la disponibilidad semanal
-- Ejecutar en Supabase > SQL Editor

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS break_start TIME,
  ADD COLUMN IF NOT EXISTS break_end   TIME;
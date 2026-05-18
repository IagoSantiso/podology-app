-- ============================================================
-- Migration: add `vacations` table for multi-day blocks
-- The redesigned schedule page has a "Vacaciones" tab for date
-- RANGES (e.g. 10–23 agosto). The existing `blocked_slots` table
-- only stores single days; vacations would explode into 14 rows
-- there. Cleaner to keep them as ranges and expand at query time.
-- ============================================================

create table if not exists vacations (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text default '',
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

alter table vacations enable row level security;

-- Lectura pública: el portal de reservas necesita saber qué días bloquear
create policy "Lectura pública de vacaciones" on vacations
  for select using (true);

-- Escritura sólo desde rutas /api/admin/* (que ya usan service_role o cookie auth)
-- No abrimos policies de insert/update/delete a anon; las maneja el backend.

-- ============================================================
-- API routes to add:
--   GET    /api/admin/vacations   →  { vacations: [...] }
--   POST   /api/admin/vacations   →  body { start_date, end_date, reason }
--   DELETE /api/admin/vacations   →  body { id }
--
-- Plus extend /api/slots and /api/admin/availability:
--   when computing free slots, filter out dates falling inside any
--   vacations row range. One query, joined with availability + holidays
--   + blocked_slots, returns the final set.
-- ============================================================

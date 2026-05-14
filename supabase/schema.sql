-- ============================================================
-- BarberApp — Schema completo
-- Pegar en Supabase > SQL Editor y ejecutar
-- ============================================================

-- Servicios ofrecidos por la barbería
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int not null,
  price numeric(6,2),
  is_active boolean default true
);

insert into services (name, duration_minutes, price) values
  ('Corte', 30, 14.00),
  ('Corte + Barba', 45, 18.00)
on conflict do nothing;

-- Disponibilidad semanal del barbero
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null,  -- 0=Dom, 1=Lun, ..., 6=Sáb
  start_time time not null,
  end_time time not null,
  is_active boolean default true
);

insert into availability (day_of_week, start_time, end_time, is_active) values
  (1, '09:00', '20:00', true),
  (2, '09:00', '20:00', true),
  (3, '09:00', '20:00', true),
  (4, '09:00', '20:00', true),
  (5, '09:00', '20:00', true),
  (6, '09:00', '14:00', true)
on conflict do nothing;

-- Bloqueos puntuales (vacaciones, descansos)
create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  start_time time,   -- null = día completo bloqueado
  end_time time,
  reason text
);

-- Citas
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid references auth.users(id),  -- null si es invitado
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  is_guest boolean default false,
  service_id uuid references services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'confirmed',  -- confirmed | cancelled | delayed | completed
  delay_minutes int,
  delay_notified boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Configuración del barbero (siempre 1 fila)
create table if not exists barber_config (
  id int primary key default 1,
  barber_phone text not null default '',
  alarm_margin_minutes int default 60,
  delay_message_template text default
    'Hola {nombre}, te aviso que hoy llegaré unos {minutos} minutos tarde. Tu nueva hora estimada es {hora_nueva}. Disculpa las molestias 🙏'
);

insert into barber_config (id) values (1) on conflict do nothing;

-- Perfiles de clientes registrados
create table if not exists client_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_service_id uuid references services(id),
  notes_for_barber text,
  created_at timestamptz default now()
);

-- Historial de visitas
create table if not exists visit_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  client_user_id uuid references auth.users(id),
  client_email text not null,
  service_id uuid references services(id),
  visit_date date not null,
  barber_notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table appointments enable row level security;
alter table client_profiles enable row level security;
alter table visit_history enable row level security;
alter table services enable row level security;
alter table availability enable row level security;
alter table blocked_slots enable row level security;
alter table barber_config enable row level security;

-- services: lectura pública
create policy "Lectura pública de servicios" on services for select using (true);

-- availability: lectura pública
create policy "Lectura pública de disponibilidad" on availability for select using (true);

-- blocked_slots: lectura pública
create policy "Lectura pública de bloqueos" on blocked_slots for select using (true);

-- barber_config: lectura pública (para obtener el template de retraso)
create policy "Lectura pública de config" on barber_config for select using (true);

-- appointments
create policy "Clientes pueden crear citas" on appointments
  for insert with check (true);

create policy "Barbero puede ver todas las citas" on appointments
  for select using (true);

create policy "Barbero puede actualizar citas" on appointments
  for update using (true);

create policy "Cliente registrado ve sus propias citas" on appointments
  for select using (auth.uid() = client_user_id);

-- client_profiles
create policy "Usuario ve su propio perfil" on client_profiles
  for select using (auth.uid() = id);

create policy "Usuario actualiza su propio perfil" on client_profiles
  for update using (auth.uid() = id);

create policy "Usuario crea su perfil" on client_profiles
  for insert with check (auth.uid() = id);

-- visit_history
create policy "Cliente registrado ve su historial" on visit_history
  for select using (auth.uid() = client_user_id);

create policy "Barbero puede ver y escribir historial" on visit_history
  for all using (true);

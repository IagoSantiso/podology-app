-- ============================================================
-- Seed de citas de prueba — semana del 2 al 6 de junio 2026
-- Pegar en Supabase > SQL Editor y ejecutar
-- ============================================================

DO $$
DECLARE
  s_corte uuid;
  s_barba uuid;
BEGIN
  SELECT id INTO s_corte FROM services WHERE name = 'Corte'         LIMIT 1;
  SELECT id INTO s_barba FROM services WHERE name = 'Corte + Barba' LIMIT 1;

  INSERT INTO appointments
    (client_name, client_email, client_phone, is_guest,
     service_id, appointment_date, start_time, end_time, status)
  VALUES

  -- ── MARTES 2 JUN ── (completadas)
  ('Alejandro Ruiz',     'alejandro@test.com',  '+34622111001', true, s_corte, '2026-06-02', '09:00', '09:30', 'completed'),
  ('Marcos Fernández',   'marcos@test.com',     '+34622111002', true, s_barba, '2026-06-02', '09:30', '10:15', 'completed'),
  ('Iván García',        'ivan@test.com',        '+34622111003', true, s_corte, '2026-06-02', '10:30', '11:00', 'completed'),
  ('Pablo Torres',       'pablo@test.com',       '+34622111004', true, s_barba, '2026-06-02', '11:00', '11:45', 'completed'),
  ('Sergio Moreno',      'sergio@test.com',      '+34622111005', true, s_corte, '2026-06-02', '12:00', '12:30', 'completed'),
  ('Diego López',        'diego@test.com',       '+34622111006', true, s_corte, '2026-06-02', '12:30', '13:00', 'completed'),
  ('Adrián Sánchez',     'adrian@test.com',      '+34622111007', true, s_barba, '2026-06-02', '15:00', '15:45', 'completed'),
  ('Raúl Jiménez',       'raul@test.com',        '+34622111008', true, s_corte, '2026-06-02', '15:45', '16:15', 'completed'),
  ('Héctor Romero',      'hector@test.com',      '+34622111009', true, s_corte, '2026-06-02', '16:30', '17:00', 'completed'),
  ('Nicolás Vega',       'nicolas@test.com',     '+34622111010', true, s_barba, '2026-06-02', '17:00', '17:45', 'completed'),
  ('Bruno Castro',       'bruno@test.com',       '+34622111011', true, s_corte, '2026-06-02', '18:00', '18:30', 'completed'),
  ('Hugo Navarro',       'hugo@test.com',        '+34622111012', true, s_corte, '2026-06-02', '19:00', '19:30', 'completed'),

  -- ── MIÉRCOLES 3 JUN ── (completadas)
  ('Daniel Ramos',       'daniel@test.com',      '+34633222001', true, s_barba, '2026-06-03', '09:00', '09:45', 'completed'),
  ('Luis Herrera',       'luis@test.com',        '+34633222002', true, s_corte, '2026-06-03', '09:45', '10:15', 'completed'),
  ('Miguel Ángel Díaz',  'miguelangel@test.com', '+34633222003', true, s_corte, '2026-06-03', '10:30', '11:00', 'completed'),
  ('Javier Muñoz',       'javier@test.com',      '+34633222004', true, s_barba, '2026-06-03', '11:00', '11:45', 'completed'),
  ('Antonio Álvarez',    'antonio@test.com',     '+34633222005', true, s_corte, '2026-06-03', '12:00', '12:30', 'completed'),
  ('Roberto Gil',        'roberto@test.com',     '+34633222006', true, s_corte, '2026-06-03', '12:30', '13:00', 'completed'),
  ('Eduardo Ortiz',      'eduardo@test.com',     '+34633222007', true, s_barba, '2026-06-03', '15:00', '15:45', 'completed'),
  ('Fernando Rubio',     'fernando@test.com',    '+34633222008', true, s_corte, '2026-06-03', '16:00', '16:30', 'completed'),
  ('Guillermo Santos',   'guillermo@test.com',   '+34633222009', true, s_corte, '2026-06-03', '17:00', '17:30', 'completed'),
  ('Tomás Vargas',       'tomas@test.com',       '+34633222010', true, s_barba, '2026-06-03', '17:30', '18:15', 'completed'),
  ('Cristian Iglesias',  'cristian@test.com',    '+34633222011', true, s_corte, '2026-06-03', '18:30', '19:00', 'completed'),
  ('Óscar Blanco',       'oscar@test.com',       '+34633222012', true, s_corte, '2026-06-03', '19:30', '20:00', 'completed'),

  -- ── JUEVES 4 JUN ── (mañana completadas, tarde confirmadas)
  ('Álvaro Cabrera',     'alvaro@test.com',      '+34644333001', true, s_corte, '2026-06-04', '09:00', '09:30', 'completed'),
  ('Emilio Peña',        'emilio@test.com',      '+34644333002', true, s_barba, '2026-06-04', '09:30', '10:15', 'completed'),
  ('Rafael Cano',        'rafael@test.com',      '+34644333003', true, s_corte, '2026-06-04', '10:30', '11:00', 'completed'),
  ('Carlos Delgado',     'carlos.d@test.com',    '+34644333004', true, s_barba, '2026-06-04', '11:00', '11:45', 'completed'),
  ('Andrés Fuentes',     'andres@test.com',      '+34644333005', true, s_corte, '2026-06-04', '12:00', '12:30', 'completed'),
  ('Víctor Molina',      'victor@test.com',      '+34644333006', true, s_corte, '2026-06-04', '12:30', '13:00', 'completed'),
  ('Marco Reyes',        'marco@test.com',       '+34644333007', true, s_corte, '2026-06-04', '15:00', '15:30', 'confirmed'),
  ('Samuel Guerrero',    'samuel@test.com',      '+34644333008', true, s_barba, '2026-06-04', '15:30', '16:15', 'confirmed'),
  ('Mateo Serrano',      'mateo@test.com',       '+34644333009', true, s_corte, '2026-06-04', '16:30', '17:00', 'confirmed'),
  ('Joel Mendoza',       'joel@test.com',        '+34644333010', true, s_barba, '2026-06-04', '17:00', '17:45', 'confirmed'),
  ('Rubén Aguilar',      'ruben@test.com',       '+34644333011', true, s_corte, '2026-06-04', '18:00', '18:30', 'confirmed'),
  ('Iker Domínguez',     'iker@test.com',        '+34644333012', true, s_corte, '2026-06-04', '19:00', '19:30', 'confirmed'),
  ('Unai Carrasco',      'unai@test.com',        '+34644333013', true, s_barba, '2026-06-04', '19:30', '20:00', 'confirmed'),

  -- ── VIERNES 5 JUN ── (confirmadas)
  ('Alex Medina',        'alex@test.com',        '+34655444001', true, s_corte, '2026-06-05', '09:00', '09:30', 'confirmed'),
  ('Ian Cortés',         'ian@test.com',         '+34655444002', true, s_barba, '2026-06-05', '09:30', '10:15', 'confirmed'),
  ('Kevin Flores',       'kevin@test.com',       '+34655444003', true, s_corte, '2026-06-05', '10:30', '11:00', 'confirmed'),
  ('Damián Rivas',       'damian@test.com',      '+34655444004', true, s_barba, '2026-06-05', '11:00', '11:45', 'confirmed'),
  ('Eric Suárez',        'eric@test.com',        '+34655444005', true, s_corte, '2026-06-05', '12:00', '12:30', 'confirmed'),
  ('Omar Lara',          'omar@test.com',        '+34655444006', true, s_corte, '2026-06-05', '12:30', '13:00', 'confirmed'),
  ('Noel Bravo',         'noel@test.com',        '+34655444007', true, s_barba, '2026-06-05', '15:00', '15:45', 'confirmed'),
  ('Dean Parra',         'dean@test.com',        '+34655444008', true, s_corte, '2026-06-05', '16:00', '16:30', 'confirmed'),
  ('Kyle Soto',          'kyle@test.com',        '+34655444009', true, s_barba, '2026-06-05', '16:30', '17:15', 'confirmed'),
  ('Troy Rojas',         'troy@test.com',        '+34655444010', true, s_corte, '2026-06-05', '17:30', '18:00', 'confirmed'),
  ('Max Silva',          'max@test.com',         '+34655444011', true, s_corte, '2026-06-05', '18:00', '18:30', 'confirmed'),
  ('Jake Ortega',        'jake@test.com',        '+34655444012', true, s_barba, '2026-06-05', '19:00', '19:45', 'confirmed'),

  -- ── SÁBADO 6 JUN ── (confirmadas, hasta 14:00)
  ('Leo Vargas',         'leo@test.com',         '+34666555001', true, s_corte, '2026-06-06', '09:00', '09:30', 'confirmed'),
  ('Arón Ibáñez',        'aron@test.com',        '+34666555002', true, s_barba, '2026-06-06', '09:30', '10:15', 'confirmed'),
  ('Kike Pascual',       'kike@test.com',        '+34666555003', true, s_corte, '2026-06-06', '10:30', '11:00', 'confirmed'),
  ('Biel Orozco',        'biel@test.com',        '+34666555004', true, s_barba, '2026-06-06', '11:00', '11:45', 'confirmed'),
  ('Pol Méndez',         'pol@test.com',         '+34666555005', true, s_corte, '2026-06-06', '12:00', '12:30', 'confirmed'),
  ('Dani Campos',        'dani@test.com',        '+34666555006', true, s_corte, '2026-06-06', '12:30', '13:00', 'confirmed'),
  ('Teo Vidal',          'teo@test.com',         '+34666555007', true, s_barba, '2026-06-06', '13:00', '13:45', 'confirmed');

END $$;

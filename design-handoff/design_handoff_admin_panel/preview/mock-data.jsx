// Mock data + design tokens — matches /supabase/schema.sql shapes

const TOKENS = {
  bg:       '#0a0a0a',
  bgCard:   '#141414',
  bgInput:  '#1a1a1a',
  border:   '#262626',
  borderSoft: '#1d1d1d',
  muted:    '#7a7367',
  mutedDim: '#525048',
  gold:     '#d4a853',
  goldDark: '#b8922e',
  goldDim:  'rgba(212,168,83,0.12)',
  goldRim:  'rgba(212,168,83,0.35)',
  cream:    '#f5f0e8',
  creamDim: '#cfc6b5',
  orange:   '#e08344',
  green:    '#5a8a5a',
  red:      '#a85050',
  display:  '"Playfair Display", Georgia, serif',
  sans:     '"DM Sans", system-ui, sans-serif',
};

// Services match {id,name,duration_minutes,price}
const SERVICES = [
  { id: 's1', name: 'Corte', duration_minutes: 30, price: 14 },
  { id: 's2', name: 'Corte + Barba', duration_minutes: 45, price: 18 },
  { id: 's3', name: 'Solo Barba', duration_minutes: 20, price: 9 },
  { id: 's4', name: 'Niño', duration_minutes: 25, price: 12 },
];

// Appointments — today, varied statuses, full shape per schema
const APPOINTMENTS = [
  {
    id: 'a1', client_name: 'Andrés Vázquez', client_phone: '+34 654 102 884',
    client_email: 'andres@gmail.com',
    start_time: '09:00:00', end_time: '09:30:00',
    appointment_date: '2026-05-15',
    status: 'completed', delay_minutes: null, delay_notified: false,
    services: SERVICES[0],
  },
  {
    id: 'a2', client_name: 'Marcos Iglesias', client_phone: '+34 622 451 901',
    client_email: 'm.iglesias@hotmail.es',
    start_time: '09:30:00', end_time: '10:15:00',
    appointment_date: '2026-05-15',
    status: 'completed', delay_minutes: null, delay_notified: false,
    services: SERVICES[1],
  },
  {
    id: 'a3', client_name: 'Diego Castro', client_phone: '+34 698 220 117',
    client_email: 'diegoc@gmail.com',
    start_time: '10:30:00', end_time: '11:00:00',
    appointment_date: '2026-05-15',
    status: 'confirmed', delay_minutes: null, delay_notified: false,
    services: SERVICES[0],
  },
  // The 11:00 slot — this is the "next" one, < 60min away in the demo
  {
    id: 'a4', client_name: 'Pablo Méndez', client_phone: '+34 611 008 743',
    client_email: 'pmendez@gmail.com',
    start_time: '11:00:00', end_time: '11:45:00',
    appointment_date: '2026-05-15',
    status: 'confirmed', delay_minutes: null, delay_notified: false,
    services: SERVICES[1],
  },
  {
    id: 'a5', client_name: 'Hugo Pérez', client_phone: '+34 644 339 220',
    client_email: 'hugo.p@gmail.com',
    start_time: '12:00:00', end_time: '12:30:00',
    appointment_date: '2026-05-15',
    status: 'delayed', delay_minutes: 15, delay_notified: true,
    services: SERVICES[0],
  },
  {
    id: 'a6', client_name: 'Javier Tomé (niño)', client_phone: '+34 666 442 108',
    client_email: 'javier.padre@gmail.com',
    start_time: '17:30:00', end_time: '17:55:00',
    appointment_date: '2026-05-15',
    status: 'confirmed', delay_minutes: null, delay_notified: false,
    services: SERVICES[3],
  },
  {
    id: 'a7', client_name: 'Roberto Lema', client_phone: '+34 619 778 220',
    client_email: 'rlema@yahoo.es',
    start_time: '18:00:00', end_time: '18:45:00',
    appointment_date: '2026-05-15',
    status: 'confirmed', delay_minutes: null, delay_notified: false,
    services: SERVICES[1],
  },
];

const AVAILABILITY = [
  { id: 'av0', day_of_week: 1, start_time: '09:00:00', end_time: '20:00:00', is_active: true },
  { id: 'av1', day_of_week: 2, start_time: '09:00:00', end_time: '20:00:00', is_active: true },
  { id: 'av2', day_of_week: 3, start_time: '09:00:00', end_time: '20:00:00', is_active: true },
  { id: 'av3', day_of_week: 4, start_time: '10:00:00', end_time: '21:00:00', is_active: true },
  { id: 'av4', day_of_week: 5, start_time: '09:00:00', end_time: '21:00:00', is_active: true },
  { id: 'av5', day_of_week: 6, start_time: '09:00:00', end_time: '14:00:00', is_active: true },
  { id: 'av6', day_of_week: 0, start_time: '00:00:00', end_time: '00:00:00', is_active: false },
];

const HOLIDAYS = [
  { id: 'h1', holiday_date: '2026-05-01', name: 'Día del Trabajador', is_national: true },
  { id: 'h2', holiday_date: '2026-08-15', name: 'Asunción de la Virgen', is_national: true },
  { id: 'h3', holiday_date: '2026-09-08', name: 'San Roque', is_national: false },
];

// Vacation ranges (new feature added in this redesign — see TSX file for migration)
const VACATIONS = [
  { id: 'v1', start_date: '2026-08-10', end_date: '2026-08-23', reason: 'Vacaciones de verano' },
];

const CONFIG = {
  barber_phone: '+34 654 102 884',
  alarm_margin_minutes: 60,
  delay_message_template:
    'Hola {nombre}, te aviso que hoy llegaré unos {minutos} minutos tarde. Tu nueva hora estimada es {hora_nueva}. Disculpa las molestias 🙏',
  business_name: 'Barbería Iglesias',
  business_address: 'Rúa do Rollo 12, Betanzos',
  owner_email: 'manuel@barberiaiglesias.es',
  logo_url: null,
  reschedule_cutoff_hours: 2,
  reminder_first_hours: 12,
  reminder_second_hours: 2,
};

const DAY_NAMES_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// "Now" — pinned to 10:15 of 15 May 2026 so the demo state is stable:
//   - Diego (10:30) is < 60min away → urgent banner
//   - Andrés + Marcos already completed
//   - Pablo (11:00) is the "next confirmed" → CTA Voy Tarde targets him
const NOW = new Date(2026, 4, 15, 10, 15);

Object.assign(window, {
  TOKENS, SERVICES, APPOINTMENTS, AVAILABILITY, HOLIDAYS, VACATIONS, CONFIG,
  DAY_NAMES_LONG, DAY_NAMES_SHORT, MONTH_NAMES, NOW,
});

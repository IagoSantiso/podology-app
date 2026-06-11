// ─────────────────────────────────────────────────────────────
// Mock data — Patricia Podología
// ─────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 'quiropodia', name: 'Quiropodia general', duration: 45, price: 30, desc: 'Corte, fresado y cuidado integral del pie' },
  { id: 'unha', name: 'Uña encarnada', duration: 40, price: 45, desc: 'Tratamiento de onicocriptosis' },
  { id: 'pisada', name: 'Estudio de la pisada', duration: 60, price: 60, desc: 'Análisis biomecánico y plantillas' },
  { id: 'durezas', name: 'Durezas y callosidades', duration: 30, price: 28, desc: 'Deslaminado de hiperqueratosis' },
  { id: 'diabetico', name: 'Pie diabético', duration: 45, price: 38, desc: 'Revisión y cuidado preventivo' },
  { id: 'reflexo', name: 'Reflexología podal', duration: 50, price: 40, desc: 'Masaje terapéutico de descarga' },
];

const BONOS = [
  { id: 'b1', name: 'Bono Quiropodia', sessions: 5, price: 135, service: 'Quiropodia general', save: '15€ de ahorro' },
  { id: 'b2', name: 'Bono Mantenimiento', sessions: 3, price: 80, service: 'Quiropodia general', save: '10€ de ahorro' },
  { id: 'b3', name: 'Bono Bienestar', sessions: 10, price: 250, service: 'Todos los servicios', save: '50€ de ahorro' },
];

// Today's appointments for admin dashboard
const APPOINTMENTS = [
  { id: 'a1', name: 'María Fernández', phone: '+34 612 044 781', service: 'quiropodia', time: '09:30', end: '10:15', status: 'completed' },
  { id: 'a2', name: 'Antonio Ruiz', phone: '+34 655 312 900', service: 'unha', time: '10:30', end: '11:10', status: 'confirmed', next: true },
  { id: 'a3', name: 'Lucía Gómez', phone: '+34 600 781 233', service: 'pisada', time: '11:45', end: '12:45', status: 'confirmed' },
  { id: 'a4', name: 'Javier Soto', phone: '+34 677 109 540', service: 'durezas', time: '13:00', end: '13:30', status: 'confirmed' },
  { id: 'a5', name: 'Carmen Vidal', phone: '+34 689 442 117', service: 'diabetico', time: '16:00', end: '16:45', status: 'confirmed' },
  { id: 'a6', name: 'Pablo Méndez', phone: '+34 633 877 002', service: 'reflexo', time: '17:15', end: '18:05', status: 'cancelled' },
];

// Week strip data (counts per weekday)
const WEEK_COUNTS = [3, 5, 4, 6, 5, 2, 0]; // Mon..Sun

const CLIENTS = [
  { name: 'María Fernández', email: 'maria.f@email.com', phone: '+34 612 044 781', account: true, visits: 8, completed: 7,
    history: [
      { date: '5 jun 2026', time: '09:30', service: 'Quiropodia general', price: 30, status: 'confirmed' },
      { date: '8 may 2026', time: '10:00', service: 'Quiropodia general', price: 30, status: 'completed' },
      { date: '3 abr 2026', time: '11:30', service: 'Durezas y callosidades', price: 28, status: 'completed' },
    ] },
  { name: 'Antonio Ruiz', email: 'aruiz@email.com', phone: '+34 655 312 900', account: false, visits: 2, completed: 1,
    history: [
      { date: '9 jun 2026', time: '10:30', service: 'Uña encarnada', price: 45, status: 'confirmed' },
      { date: '12 may 2026', time: '17:00', service: 'Uña encarnada', price: 45, status: 'completed' },
    ] },
  { name: 'Lucía Gómez', email: 'lucia.gomez@email.com', phone: '+34 600 781 233', account: true, visits: 4, completed: 3,
    history: [
      { date: '9 jun 2026', time: '11:45', service: 'Estudio de la pisada', price: 60, status: 'confirmed' },
      { date: '2 mar 2026', time: '16:30', service: 'Quiropodia general', price: 30, status: 'completed' },
    ] },
  { name: 'Carmen Vidal', email: 'cvidal@email.com', phone: '+34 689 442 117', account: true, visits: 12, completed: 12,
    history: [
      { date: '9 jun 2026', time: '16:00', service: 'Pie diabético', price: 38, status: 'confirmed' },
      { date: '12 may 2026', time: '16:00', service: 'Pie diabético', price: 38, status: 'completed' },
    ] },
];

// Logged-in client's own visit history
const MY_VISITS = [
  { date: '12 marzo 2026', service: 'Quiropodia general', price: 30, notes: 'Buena evolución. Recomiendo mantener pauta cada 6 semanas.' },
  { date: '18 diciembre 2025', service: 'Uña encarnada', price: 45, notes: 'Reborde lateral del primer dedo. Curación correcta, sin signos de infección.' },
  { date: '2 octubre 2025', service: 'Estudio de la pisada', price: 60, notes: 'Pronación leve. Plantillas personalizadas entregadas.' },
];

// Weekly availability for schedule screen
const AVAILABILITY = [
  { day: 'Lunes', active: true, start: '09:00', end: '20:00', break: ['14:00', '16:00'] },
  { day: 'Martes', active: true, start: '09:00', end: '20:00', break: ['14:00', '16:00'] },
  { day: 'Miércoles', active: true, start: '09:00', end: '20:00', break: ['14:00', '16:00'] },
  { day: 'Jueves', active: true, start: '09:00', end: '20:00', break: ['14:00', '16:00'] },
  { day: 'Viernes', active: true, start: '09:00', end: '15:00', break: null },
  { day: 'Sábado', active: false, start: '10:00', end: '14:00', break: null },
  { day: 'Domingo', active: false, start: '', end: '', break: null },
];

const TIME_SLOTS = ['09:00', '09:45', '10:30', '11:15', '12:00', '16:00', '16:45', '17:30', '18:15', '19:00'];

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function svcById(id) { return SERVICES.find(s => s.id === id); }

Object.assign(window, {
  SERVICES, BONOS, APPOINTMENTS, WEEK_COUNTS, CLIENTS, MY_VISITS,
  AVAILABILITY, TIME_SLOTS, DAYS_SHORT, MONTHS_SHORT, svcById,
});

import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { addDays, format, addMinutes, parse } from 'date-fns'

const FAKE_CLIENTS = [
  { name: 'Carlos García',    email: 'carlos.garcia@ejemplo.com',   phone: '612345678' },
  { name: 'Marcos López',     email: 'marcos.lopez@ejemplo.com',    phone: '623456789' },
  { name: 'David Pérez',      email: 'david.perez@ejemplo.com',     phone: '634567890' },
  { name: 'Alberto Rodríguez',email: 'alberto.rod@ejemplo.com',     phone: '645678901' },
  { name: 'Roberto Sánchez',  email: 'roberto.san@ejemplo.com',     phone: '656789012' },
  { name: 'Fernando Martínez',email: 'fernando.m@ejemplo.com',      phone: '667890123' },
  { name: 'Javier González',  email: 'javier.g@ejemplo.com',        phone: '678901234' },
  { name: 'Miguel Hernández', email: 'miguel.h@ejemplo.com',        phone: '689012345' },
  { name: 'Antonio Díaz',     email: 'antonio.d@ejemplo.com',       phone: '690123456' },
  { name: 'Pablo Torres',     email: 'pablo.t@ejemplo.com',         phone: '601234567' },
  { name: 'Iván Castillo',    email: 'ivan.c@ejemplo.com',          phone: '611222333' },
  { name: 'Sergio Moreno',    email: 'sergio.m@ejemplo.com',        phone: '622333444' },
]

export async function POST() {
  const supabase = createSupabaseAdmin()

  // Fetch services and availability
  const [{ data: services }, { data: availability }] = await Promise.all([
    supabase.from('services').select('id, duration_minutes').eq('is_active', true),
    supabase.from('availability').select('day_of_week, start_time, end_time').eq('is_active', true),
  ])

  if (!services?.length) {
    return NextResponse.json({ error: 'No hay servicios activos' }, { status: 400 })
  }
  if (!availability?.length) {
    return NextResponse.json({ error: 'No hay disponibilidad configurada' }, { status: 400 })
  }

  const availMap = new Map(availability.map(a => [a.day_of_week, a]))
  const today = new Date()
  const inserted: string[] = []
  let clientIdx = 0

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = addDays(today, dayOffset)
    const dow = date.getDay()
    const avail = availMap.get(dow)
    if (!avail) continue

    const dateStr = format(date, 'yyyy-MM-dd')

    // Fetch existing appointments to avoid overlaps
    const { data: existing } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled')

    const occupied = (existing ?? []).map(a => ({
      start: toMin(a.start_time),
      end: toMin(a.end_time),
    }))

    const workStart = toMin(avail.start_time)
    const workEnd = toMin(avail.end_time)
    const workMinutes = workEnd - workStart

    // Generate 5-7 appointments spread across the day
    const targetCount = workMinutes >= 480 ? 7 : workMinutes >= 240 ? 4 : 2
    const baseDate = new Date(dateStr + 'T00:00:00')

    let cursor = workStart

    for (let i = 0; i < targetCount; i++) {
      const service = services[i % services.length]
      const dur = service.duration_minutes

      // Skip if not enough time left
      if (cursor + dur > workEnd) break

      // Check overlap
      const overlaps = occupied.some(o => cursor < o.end && cursor + dur > o.start)
      if (overlaps) { cursor += dur + 30; i--; continue }

      const startTime = format(parse(`${pad(Math.floor(cursor/60))}:${pad(cursor%60)}`, 'HH:mm', baseDate), 'HH:mm')
      const endTime   = format(addMinutes(parse(startTime, 'HH:mm', baseDate), dur), 'HH:mm')
      const client    = FAKE_CLIENTS[clientIdx % FAKE_CLIENTS.length]
      clientIdx++

      const { error } = await supabase.from('appointments').insert({
        client_name:      client.name,
        client_email:     client.email,
        client_phone:     client.phone,
        service_id:       service.id,
        appointment_date: dateStr,
        start_time:       startTime,
        end_time:         endTime,
        is_guest:         true,
        client_user_id:   null,
        status:           'confirmed',
        reschedule_token: crypto.randomUUID(),
      })

      if (!error) {
        occupied.push({ start: cursor, end: cursor + dur })
        inserted.push(`${dateStr} ${startTime} — ${client.name}`)
      }

      // 30-min gap between appointments
      cursor += dur + 30
    }
  }

  return NextResponse.json({ ok: true, inserted, count: inserted.length })
}

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function pad(n: number) {
  return String(n).padStart(2, '0')
}

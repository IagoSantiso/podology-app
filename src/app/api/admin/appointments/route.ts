import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { addMinutes, format, parse } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const since = searchParams.get('since') // ISO timestamp for new-appointment polling

  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('appointments')
    .select('*, services(name, duration_minutes, price)')
    .order('start_time', { ascending: true })

  if (date) {
    query = query.eq('appointment_date', date)
  } else if (startDate && endDate) {
    query = query.gte('appointment_date', startDate).lte('appointment_date', endDate)
  } else {
    return NextResponse.json({ error: 'Falta date o startDate/endDate' }, { status: 400 })
  }

  if (since) {
    query = query.gt('created_at', since)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_name, client_email, client_phone, service_id, appointment_date, start_time, time } = body

  const startStr = start_time ?? time
  if (!client_name || !client_phone || !service_id || !appointment_date || !startStr) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', service_id)
    .single()

  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })

  const baseDate = new Date(appointment_date + 'T00:00:00')
  const start = parse(startStr, 'HH:mm', baseDate)
  const end = addMinutes(start, service.duration_minutes)
  const endStr = format(end, 'HH:mm')

  // Overlap check
  const { data: existing } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('appointment_date', appointment_date)
    .neq('status', 'cancelled')

  const startMin = start.getHours() * 60 + start.getMinutes()
  const endMin = end.getHours() * 60 + end.getMinutes()

  const overlaps = (existing ?? []).some(apt => {
    const [ah, am] = apt.start_time.split(':').map(Number)
    const [eh, em] = apt.end_time.split(':').map(Number)
    const aStart = ah * 60 + am
    const aEnd = eh * 60 + em
    return startMin < aEnd && endMin > aStart
  })

  if (overlaps) {
    return NextResponse.json({ error: 'Ya hay una cita en ese horario' }, { status: 409 })
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_name,
      client_email: client_email || 'sinEmail@barberia.local',
      client_phone,
      service_id,
      appointment_date,
      start_time: startStr,
      end_time: endStr,
      is_guest: true,
      client_user_id: null,
      status: 'confirmed',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointment }, { status: 201 })
}

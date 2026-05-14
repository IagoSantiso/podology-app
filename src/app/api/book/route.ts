import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { addMinutes, format, parse } from 'date-fns'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clientName, clientEmail, clientPhone, serviceId, appointmentDate, startTime, isGuest, clientUserId } = body

  if (!clientName || !clientEmail || !clientPhone || !serviceId || !appointmentDate || !startTime) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const baseDate = new Date(appointmentDate + 'T00:00:00')
  const start = parse(startTime, 'HH:mm', baseDate)
  const end = addMinutes(start, service.duration_minutes)
  const endTime = format(end, 'HH:mm')

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      service_id: serviceId,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      is_guest: isGuest ?? true,
      client_user_id: clientUserId ?? null,
      status: 'confirmed',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando cita:', error)
    return NextResponse.json({ error: 'No se pudo crear la cita' }, { status: 500 })
  }

  return NextResponse.json({ appointment }, { status: 201 })
}

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

  const rescheduleToken = crypto.randomUUID()

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
      reschedule_token: rescheduleToken,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando cita:', error)
    return NextResponse.json({ error: 'No se pudo crear la cita' }, { status: 500 })
  }

  // Auto-decrement active bono for this client + service
  const { data: bonoRows } = await supabase
    .from('client_bonos')
    .select('id, remaining_sessions, bonos(service_id)')
    .eq('client_email', clientEmail)
    .eq('is_active', true)
    .gt('remaining_sessions', 0)
    .order('purchased_at', { ascending: true })
    .limit(1)

  if (bonoRows && bonoRows.length > 0) {
    const cb = bonoRows[0]
    const bonoServiceId = (cb.bonos as unknown as { service_id: string | null } | null)?.service_id
    if (!bonoServiceId || bonoServiceId === serviceId) {
      const newRemaining = cb.remaining_sessions - 1
      await supabase
        .from('client_bonos')
        .update({ remaining_sessions: newRemaining, is_active: newRemaining > 0 })
        .eq('id', cb.id)
    }
  }

  return NextResponse.json({ appointment }, { status: 201 })
}

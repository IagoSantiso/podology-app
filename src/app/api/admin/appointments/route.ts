import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { sendConfirmationEmail } from '@/lib/brevo'
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
    .select('duration_minutes, name, price')
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

  const FAKE_EMAIL = 'sinEmail@podologia.local'
  const finalEmail = client_email || FAKE_EMAIL
  const rescheduleToken = crypto.randomUUID()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_name,
      client_email: finalEmail,
      client_phone,
      service_id,
      appointment_date,
      start_time: startStr,
      end_time: endStr,
      is_guest: true,
      client_user_id: null,
      status: 'confirmed',
      reschedule_token: rescheduleToken,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let emailWarning: string | null = null

  if (finalEmail !== FAKE_EMAIL) {
    try {
      const { data: cfg } = await supabase
        .from('podologist_config')
        .select('business_name, business_address')
        .eq('id', 1)
        .maybeSingle()

      await sendConfirmationEmail({
        clientName:      client_name,
        clientEmail:     finalEmail,
        serviceName:     service.name,
        appointmentDate: appointment_date,
        startTime:       startStr,
        price:           service.price ?? null,
        appointmentId:   appointment.id,
        rescheduleToken,
        isGuest:         true,
        businessName:    cfg?.business_name,
        businessAddress: cfg?.business_address,
      })
    } catch {
      emailWarning = 'Cita creada, pero no se pudo enviar el email de confirmación al cliente'
    }
  }

  return NextResponse.json({ appointment, ...(emailWarning && { emailWarning }) }, { status: 201 })
}

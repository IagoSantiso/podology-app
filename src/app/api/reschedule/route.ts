import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { getAvailableSlots } from '@/lib/slots'
import { sendConfirmationEmail } from '@/lib/brevo'
import { addMinutes, format, parse } from 'date-fns'

// GET /api/reschedule?token=xxx&date=yyyy-MM-dd
// Returns appointment info + available slots for the given date
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const dateStr = searchParams.get('date')

  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const supabase = createSupabaseAdmin()

  const [{ data: apt }, { data: cfg }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, services(name, price, duration_minutes)')
      .eq('reschedule_token', token)
      .neq('status', 'cancelled')
      .maybeSingle(),
    supabase.from('podologist_config').select('reschedule_cutoff_hours, business_name, business_address').eq('id', 1).maybeSingle(),
  ])

  if (!apt) return NextResponse.json({ error: 'Cita no encontrada o ya cancelada' }, { status: 404 })

  const cutoffHours = cfg?.reschedule_cutoff_hours ?? 2
  const aptDatetime = new Date(`${apt.appointment_date}T${apt.start_time}`)
  const msUntil = aptDatetime.getTime() - Date.now()
  const hoursUntil = msUntil / (1000 * 60 * 60)

  if (hoursUntil < cutoffHours) {
    return NextResponse.json({
      error: `Ya no es posible reagendar. El plazo máximo es ${cutoffHours} hora${cutoffHours !== 1 ? 's' : ''} antes de la cita.`,
      tooLate: true,
    }, { status: 403 })
  }

  const durationMinutes = (apt.services as { duration_minutes: number } | null)?.duration_minutes ?? 30
  let slots: string[] = []

  if (dateStr) {
    const date = new Date(dateStr + 'T00:00:00')
    if (!isNaN(date.getTime())) {
      // Exclude the current appointment slot when fetching available slots
      slots = await getAvailableSlots(date, durationMinutes, apt.id)
    }
  }

  return NextResponse.json({
    appointment: {
      id: apt.id,
      clientName: apt.client_name,
      serviceName: (apt.services as { name: string } | null)?.name ?? '',
      price: (apt.services as { price: number | null } | null)?.price ?? null,
      appointmentDate: apt.appointment_date,
      startTime: apt.start_time,
      durationMinutes,
    },
    config: {
      cutoffHours,
      businessName: cfg?.business_name ?? 'PodologyApp',
    },
    slots,
  })
}

// PUT /api/reschedule
// Body: { token, newDate, newStartTime }
export async function PUT(req: NextRequest) {
  const { token, newDate, newStartTime } = await req.json()

  if (!token || !newDate || !newStartTime) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const [{ data: apt }, { data: cfg }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, services(name, price, duration_minutes)')
      .eq('reschedule_token', token)
      .neq('status', 'cancelled')
      .maybeSingle(),
    supabase.from('podologist_config').select('reschedule_cutoff_hours, business_name, business_address').eq('id', 1).maybeSingle(),
  ])

  if (!apt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  const cutoffHours = cfg?.reschedule_cutoff_hours ?? 2
  const aptDatetime = new Date(`${apt.appointment_date}T${apt.start_time}`)
  const hoursUntil = (aptDatetime.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < cutoffHours) {
    return NextResponse.json({ error: 'Fuera del plazo para reagendar', tooLate: true }, { status: 403 })
  }

  const durationMinutes = (apt.services as { duration_minutes: number } | null)?.duration_minutes ?? 30
  const base = new Date(newDate + 'T00:00:00')
  const newStart = parse(newStartTime, 'HH:mm', base)
  const newEnd = addMinutes(newStart, durationMinutes)
  const newEndTime = format(newEnd, 'HH:mm')

  // Validate the new slot is still available (excluding current appointment)
  const available = await getAvailableSlots(base, durationMinutes, apt.id)
  if (!available.includes(newStartTime)) {
    return NextResponse.json({ error: 'El horario seleccionado ya no está disponible' }, { status: 409 })
  }

  // Generate new token so the old link stops working
  const newToken = crypto.randomUUID()

  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      reschedule_token: newToken,
      reminder_first_sent: false,
      reminder_second_sent: false,
    })
    .eq('id', apt.id)

  if (error) return NextResponse.json({ error: 'No se pudo reagendar' }, { status: 500 })

  // Send new confirmation with updated details
  try {
    await sendConfirmationEmail({
      clientName: apt.client_name,
      clientEmail: apt.client_email,
      serviceName: (apt.services as { name: string } | null)?.name ?? '',
      appointmentDate: newDate,
      startTime: newStartTime,
      price: (apt.services as { price: number | null } | null)?.price ?? null,
      appointmentId: apt.id,
      rescheduleToken: newToken,
      isGuest: apt.is_guest,
      businessName: cfg?.business_name ?? 'PodologyApp',
      businessAddress: cfg?.business_address ?? '',
    })
  } catch {
    // Non-fatal: cita was rescheduled even if email fails
  }

  return NextResponse.json({ ok: true })
}

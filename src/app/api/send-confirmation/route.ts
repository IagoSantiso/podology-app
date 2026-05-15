import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { sendConfirmationEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json()

  if (!appointmentId) {
    return NextResponse.json({ error: 'Falta appointmentId' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const [{ data: apt }, { data: cfg }] = await Promise.all([
    supabase.from('appointments').select('*, services(name, price)').eq('id', appointmentId).single(),
    supabase.from('barber_config').select('business_name, business_address').eq('id', 1).maybeSingle(),
  ])

  if (!apt) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  try {
    await sendConfirmationEmail({
      clientName: apt.client_name,
      clientEmail: apt.client_email,
      serviceName: apt.services?.name ?? '',
      appointmentDate: apt.appointment_date,
      startTime: apt.start_time,
      price: apt.services?.price ?? null,
      appointmentId: apt.id,
      rescheduleToken: apt.reschedule_token ?? '',
      isGuest: apt.is_guest,
      businessName: cfg?.business_name ?? 'BarberApp',
      businessAddress: cfg?.business_address ?? '',
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error enviando email:', err)
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
  }
}

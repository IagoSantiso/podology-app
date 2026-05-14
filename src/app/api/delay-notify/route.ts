import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { sendWhatsApp } from '@/lib/twilio'
import { addMinutes, format, parse } from 'date-fns'

export async function POST(req: NextRequest) {
  const { appointmentId, delayMinutes } = await req.json()

  if (!appointmentId || !delayMinutes) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const [{ data: apt }, { data: config }] = await Promise.all([
    supabase.from('appointments').select('*').eq('id', appointmentId).single(),
    supabase.from('barber_config').select('*').eq('id', 1).single(),
  ])

  if (!apt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (!config) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const baseDate = new Date(apt.appointment_date + 'T00:00:00')
  const originalStart = parse(apt.start_time, 'HH:mm:ss', baseDate)
  const newStart = addMinutes(originalStart, delayMinutes)
  const newStartStr = format(newStart, 'HH:mm')

  const message = (config.delay_message_template as string)
    .replace('{nombre}', apt.client_name)
    .replace('{minutos}', String(delayMinutes))
    .replace('{hora_nueva}', newStartStr)

  try {
    await sendWhatsApp(apt.client_phone, message)

    await supabase
      .from('appointments')
      .update({ delay_minutes: delayMinutes, delay_notified: true, status: 'delayed' })
      .eq('id', appointmentId)

    return NextResponse.json({ ok: true, newStart: newStartStr })
  } catch (err) {
    console.error('Error enviando WhatsApp:', err)
    return NextResponse.json({ error: 'Error enviando WhatsApp' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { addMinutes, format, parse } from 'date-fns'
import { sendRescheduleByBarberEmail, sendCancelByBarberEmail } from '@/lib/resend'

const FAKE_EMAIL = 'sinEmail@barberia.local'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  // Fetch current appointment to detect changes and compute new end_time
  const { data: current, error: fetchErr } = await supabase
    .from('appointments')
    .select('*, services(id, name, duration_minutes, price)')
    .eq('id', id)
    .single()

  if (fetchErr || !current) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  const updates: Record<string, unknown> = {}

  // ── Standard status/delay fields ──────────────────────────────────────────
  if (body.status !== undefined) updates.status = body.status
  if (body.delay_minutes !== undefined) updates.delay_minutes = body.delay_minutes
  if (body.delay_notified !== undefined) updates.delay_notified = body.delay_notified
  if (body.barber_notes !== undefined) updates.barber_notes = body.barber_notes

  // ── Reschedule: allow changing date, time, or service ─────────────────────
  const isReschedule =
    body.appointment_date !== undefined ||
    body.start_time !== undefined ||
    body.service_id !== undefined

  if (isReschedule) {
    const newDate      = body.appointment_date ?? current.appointment_date
    const newServiceId = body.service_id       ?? current.service_id
    const newStart     = (body.start_time ?? current.start_time).slice(0, 5)

    // Resolve service duration (use current unless service changes)
    let durationMin: number = current.services?.duration_minutes ?? 30
    if (body.service_id && body.service_id !== current.service_id) {
      const { data: svc } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', newServiceId)
        .single()
      if (svc) durationMin = svc.duration_minutes
    }

    // Compute new end_time
    const baseDate = new Date(newDate + 'T00:00:00')
    const startDt  = parse(newStart, 'HH:mm', baseDate)
    const endDt    = addMinutes(startDt, durationMin)
    const newEnd   = format(endDt, 'HH:mm')

    // Overlap check (excluding this appointment)
    const { data: others } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('appointment_date', newDate)
      .neq('status', 'cancelled')
      .neq('id', id)

    const startMin = startDt.getHours() * 60 + startDt.getMinutes()
    const endMin   = endDt.getHours()   * 60 + endDt.getMinutes()

    const overlaps = (others ?? []).some(apt => {
      const [ah, am] = apt.start_time.split(':').map(Number)
      const [eh, em] = apt.end_time.split(':').map(Number)
      return startMin < eh * 60 + em && endMin > ah * 60 + am
    })

    if (overlaps) {
      return NextResponse.json({ error: 'Ya hay una cita en ese horario' }, { status: 409 })
    }

    updates.appointment_date = newDate
    updates.start_time       = newStart
    updates.end_time         = newEnd
    updates.service_id       = newServiceId
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*, services(name, price)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Side-effects ──────────────────────────────────────────────────────────

  // 1. Completion → visit_history
  if (body.status === 'completed' && data) {
    await supabase.from('visit_history').insert({
      appointment_id:  data.id,
      client_user_id:  data.client_user_id ?? null,
      client_email:    data.client_email,
      service_id:      data.service_id,
      visit_date:      data.appointment_date,
      barber_notes:    body.barber_notes ?? null,
    })
  }

  const hasEmail = current.client_email && current.client_email !== FAKE_EMAIL

  // 2. Cancellation → email
  if (body.status === 'cancelled' && hasEmail) {
    await sendCancelByBarberEmail({
      clientName:      current.client_name,
      clientEmail:     current.client_email,
      serviceName:     current.services?.name ?? '',
      appointmentDate: current.appointment_date,
      startTime:       current.start_time,
      note:            body.cancel_note ?? null,
    }).catch(() => { /* email failure non-fatal */ })
  }

  // 3. Reschedule → email (only if date or time actually changed)
  if (isReschedule && hasEmail) {
    const oldDate = current.appointment_date
    const oldTime = current.start_time.slice(0, 5)
    const newDate = updates.appointment_date as string
    const newTime = updates.start_time as string

    const changed = oldDate !== newDate || oldTime !== newTime
    if (changed) {
      // Resolve new service name if service changed
      let newServiceName = current.services?.name ?? ''
      if (body.service_id && body.service_id !== current.service_id) {
        const { data: svc } = await supabase
          .from('services').select('name').eq('id', body.service_id).single()
        if (svc) newServiceName = svc.name
      }

      await sendRescheduleByBarberEmail({
        clientName:  current.client_name,
        clientEmail: current.client_email,
        serviceName: newServiceName,
        oldDate,
        oldTime,
        newDate,
        newTime,
        note: body.reschedule_note ?? null,
      }).catch(() => { /* email failure non-fatal */ })
    }
  }

  return NextResponse.json({ appointment: data })
}

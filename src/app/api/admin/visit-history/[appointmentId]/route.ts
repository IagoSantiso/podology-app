import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('visit_history')
    .select('id, clinical_notes, treatment_name, treatment_instructions, podologist_notes')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  const updates = {
    clinical_notes:         body.clinical_notes         ?? null,
    treatment_name:         body.treatment_name         ?? null,
    treatment_instructions: body.treatment_instructions ?? null,
    podologist_notes:       body.podologist_notes       ?? null,
  }

  const { data: existing } = await supabase
    .from('visit_history')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('visit_history')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ record: data })
  }

  // No entry yet — create one from appointment data
  const { data: apt, error: aptErr } = await supabase
    .from('appointments')
    .select('client_user_id, client_email, service_id, appointment_date')
    .eq('id', appointmentId)
    .single()

  if (aptErr || !apt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  const { data, error } = await supabase
    .from('visit_history')
    .insert({
      appointment_id:  appointmentId,
      client_user_id:  apt.client_user_id ?? null,
      client_email:    apt.client_email,
      service_id:      apt.service_id,
      visit_date:      apt.appointment_date,
      ...updates,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}

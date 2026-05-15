import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.delay_minutes !== undefined) updates.delay_minutes = body.delay_minutes
  if (body.delay_notified !== undefined) updates.delay_notified = body.delay_notified

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*, services(name, price)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se marca como completada, insertar en visit_history
  if (body.status === 'completed' && data) {
    await supabase.from('visit_history').insert({
      appointment_id: data.id,
      client_user_id: data.client_user_id ?? null,
      client_email: data.client_email,
      service_id: data.service_id,
      visit_date: data.appointment_date,
      barber_notes: body.barber_notes ?? null,
    })
  }

  return NextResponse.json({ appointment: data })
}

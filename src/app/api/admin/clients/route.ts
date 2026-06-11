import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('appointments')
    .select('id, client_name, client_email, client_phone, is_guest, appointment_date, start_time, status, services(name, price), visit_history(clinical_notes, treatment_name, treatment_instructions, podologist_notes)')
    .order('appointment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data })
}

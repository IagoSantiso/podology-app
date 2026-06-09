import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('podologist_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data ?? {} })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  const allowed = [
    'podologist_phone', 'alarm_margin_minutes', 'delay_message_template',
    'business_name', 'business_address', 'owner_email', 'logo_url',
    'reschedule_cutoff_hours', 'reminder_first_hours', 'reminder_second_hours',
    'owner_name', 'nif', 'address', 'contact_email', 'data_retention_years',
  ]

  const updates: Record<string, unknown> = { id: 1 }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { error } = await supabase.from('podologist_config').upsert(updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

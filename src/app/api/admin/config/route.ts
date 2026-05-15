import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('barber_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  const updates: Record<string, unknown> = {}
  const allowed = [
    'barber_phone', 'alarm_margin_minutes', 'delay_message_template',
    'business_name', 'business_address', 'owner_email', 'logo_url', 'admin_password',
  ]
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { error } = await supabase.from('barber_config').update(updates).eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

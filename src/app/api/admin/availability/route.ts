import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .order('day_of_week', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ availability: data })
}

export async function PUT(req: NextRequest) {
  const { availability } = await req.json()
  const supabase = createSupabaseAdmin()

  const { error } = await supabase
    .from('availability')
    .upsert(availability, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

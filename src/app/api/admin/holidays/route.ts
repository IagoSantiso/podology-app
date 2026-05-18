import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('holiday_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holidays: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { holiday_date, name, is_national } = await req.json()
  if (!holiday_date || !name) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('holidays')
    .upsert({ holiday_date, name, is_national: is_national ?? false }, { onConflict: 'holiday_date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also block the full day in blocked_slots
  await supabase.from('blocked_slots').upsert(
    { blocked_date: holiday_date, start_time: null, end_time: null, reason: name },
    { onConflict: 'blocked_date' }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { holiday_date } = await req.json()
  const supabase = createSupabaseAdmin()

  await Promise.all([
    supabase.from('holidays').delete().eq('holiday_date', holiday_date),
    supabase.from('blocked_slots').delete().eq('blocked_date', holiday_date),
  ])

  return NextResponse.json({ ok: true })
}

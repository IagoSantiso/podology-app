import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vacations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { start_date, end_date, reason } = await req.json()
  if (!start_date || !end_date) return NextResponse.json({ error: 'Faltan start_date o end_date' }, { status: 400 })
  if (end_date < start_date) return NextResponse.json({ error: 'end_date debe ser >= start_date' }, { status: 400 })

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('vacations')
    .insert({ start_date, end_date, reason: reason ?? '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vacation: data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('vacations').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

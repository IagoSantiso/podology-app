import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('price', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ services: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, price, duration_minutes } = body
  if (!name || !duration_minutes) {
    return NextResponse.json({ error: 'Nombre y duración son obligatorios' }, { status: 400 })
  }
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('services')
    .insert({ name, price: price ?? null, duration_minutes, is_active: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

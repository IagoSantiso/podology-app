import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('bonos')
    .select('*, services(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bonos: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, service_id, total_sessions, price } = body
  if (!name || !total_sessions) {
    return NextResponse.json({ error: 'Nombre y número de sesiones son obligatorios' }, { status: 400 })
  }
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('bonos')
    .insert({
      name,
      service_id: service_id || null,
      total_sessions,
      price: price ?? null,
      is_active: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bono: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('bonos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bono: data })
}

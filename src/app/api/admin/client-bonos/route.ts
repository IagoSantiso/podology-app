import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('client_bonos')
    .select('*, bonos(name, total_sessions, services(name))')
    .order('purchased_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clientBonos: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bono_id, client_name, client_email, client_phone, notes } = body
  if (!bono_id || !client_name || !client_email) {
    return NextResponse.json({ error: 'Bono, nombre y email son obligatorios' }, { status: 400 })
  }
  const supabase = createSupabaseAdmin()
  const { data: bono } = await supabase
    .from('bonos')
    .select('total_sessions')
    .eq('id', bono_id)
    .single()
  if (!bono) return NextResponse.json({ error: 'Bono no encontrado' }, { status: 404 })

  const { data, error } = await supabase
    .from('client_bonos')
    .insert({
      bono_id,
      client_name,
      client_email,
      client_phone: client_phone || null,
      total_sessions: bono.total_sessions,
      remaining_sessions: bono.total_sessions,
      notes: notes || null,
      is_active: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clientBono: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, action, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const supabase = createSupabaseAdmin()

  if (action === 'use') {
    const { data: current } = await supabase
      .from('client_bonos')
      .select('remaining_sessions')
      .eq('id', id)
      .single()
    if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (current.remaining_sessions <= 0) {
      return NextResponse.json({ error: 'Sin sesiones restantes' }, { status: 400 })
    }
    const newRemaining = current.remaining_sessions - 1
    const { data, error } = await supabase
      .from('client_bonos')
      .update({ remaining_sessions: newRemaining, is_active: newRemaining > 0 })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clientBono: data })
  }

  const { data, error } = await supabase
    .from('client_bonos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clientBono: data })
}

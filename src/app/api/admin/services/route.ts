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
  const { name, price, duration_minutes, description } = body
  if (!name || !duration_minutes) {
    return NextResponse.json({ error: 'Nombre y duración son obligatorios' }, { status: 400 })
  }
  const supabase = createSupabaseAdmin()

  // Check if description column exists by attempting insert with it first
  const insertData: Record<string, unknown> = { name, price: price ?? null, duration_minutes, is_active: true }
  if (description) insertData.description = description

  const { data, error } = await supabase
    .from('services')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    // description column may not exist yet — retry without it
    if (description && error.message.includes('description')) {
      const { data: data2, error: error2 } = await supabase
        .from('services')
        .insert({ name, price: price ?? null, duration_minutes, is_active: true })
        .select()
        .single()
      if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
      return NextResponse.json({ service: data2 }, { status: 201 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ service: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, description, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  if (description !== undefined) updates.description = description

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // description column may not exist yet — retry without it
    if (description !== undefined && error.message.includes('description')) {
      const { description: _d, ...safeUpdates } = updates
      const { data: data2, error: error2 } = await supabase
        .from('services')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single()
      if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
      return NextResponse.json({ service: data2 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
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

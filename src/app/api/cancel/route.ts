import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json()

  if (!appointmentId) {
    return NextResponse.json({ error: 'Falta appointmentId' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const { data: apt } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single()

  if (!apt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (apt.status === 'cancelled') return NextResponse.json({ error: 'Ya cancelada' }, { status: 400 })

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) return NextResponse.json({ error: 'No se pudo cancelar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

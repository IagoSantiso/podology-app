import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/slots'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!dateStr || !serviceId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const date = new Date(dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const slots = await getAvailableSlots(date, service.duration_minutes)
  return NextResponse.json({ slots })
}

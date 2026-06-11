import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

type AppointmentRow = {
  appointment_date: string
  services: { name: string; price: number | null } | null
}

type BonoRequestRow = {
  created_at: string
  bonos: { name: string; price: number | null } | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from y to son obligatorios' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const [{ data: apts, error: aptErr }, { data: bonos, error: bonoErr }] = await Promise.all([
    supabase
      .from('appointments')
      .select('appointment_date, services(name, price)')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .neq('status', 'cancelled'),
    supabase
      .from('bono_requests')
      .select('created_at, bonos(name, price)')
      .eq('status', 'paid')
      .gte('created_at', from + 'T00:00:00')
      .lte('created_at', to + 'T23:59:59'),
  ])

  if (aptErr)  return NextResponse.json({ error: aptErr.message  }, { status: 500 })
  if (bonoErr) return NextResponse.json({ error: bonoErr.message }, { status: 500 })

  const appointments  = (apts  ?? []) as unknown as AppointmentRow[]
  const bonoRequests  = (bonos ?? []) as unknown as BonoRequestRow[]

  const lineItems = [
    ...appointments.map(a => ({
      fecha:    a.appointment_date,
      concepto: a.services?.name  ?? 'Servicio',
      tipo:     'consulta' as const,
      importe:  a.services?.price ?? 0,
    })),
    ...bonoRequests.map(b => ({
      fecha:    b.created_at.slice(0, 10),
      concepto: b.bonos?.name  ?? 'Bono',
      tipo:     'bono' as const,
      importe:  b.bonos?.price ?? 0,
    })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha))

  const byService: Record<string, { count: number; revenue: number }> = {}
  for (const a of appointments) {
    const name  = a.services?.name  ?? 'Sin servicio'
    const price = a.services?.price ?? 0
    if (!byService[name]) byService[name] = { count: 0, revenue: 0 }
    byService[name].count++
    byService[name].revenue += price
  }

  const totalCitas = appointments.reduce((s, a) => s + (a.services?.price ?? 0), 0)
  const totalBonos = bonoRequests.reduce((s, b) => s + (b.bonos?.price  ?? 0), 0)

  return NextResponse.json({
    totalCitas,
    totalBonos,
    totalFacturado: totalCitas + totalBonos,
    numCitas:  appointments.length,
    numBonos:  bonoRequests.length,
    porServicio: Object.entries(byService)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    lineItems,
  })
}

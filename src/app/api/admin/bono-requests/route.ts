import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('bono_requests')
    .select('*, bonos(name, total_sessions, price, services(name))')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id y status son requeridos' }, { status: 400 })
  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Status no válido' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  // Fetch the request to get bono and client info
  const { data: request, error: fetchErr } = await supabase
    .from('bono_requests')
    .select('*, bonos(total_sessions)')
    .eq('id', id)
    .single()

  if (fetchErr || !request) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  // Update status
  const { error: updateErr } = await supabase
    .from('bono_requests')
    .update({ status })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // On paid: create client_bonos record for recipient (or buyer if not a gift)
  if (status === 'paid') {
    const recipientName  = request.is_gift ? request.recipient_name  : request.buyer_name
    const recipientEmail = request.is_gift ? request.recipient_email : request.buyer_email
    const totalSessions  = (request.bonos as { total_sessions: number } | null)?.total_sessions ?? 0

    await supabase.from('client_bonos').insert({
      bono_id:             request.bono_id,
      client_name:         recipientName,
      client_email:        recipientEmail,
      client_phone:        request.is_gift ? null : request.buyer_phone,
      total_sessions:      totalSessions,
      remaining_sessions:  totalSessions,
      is_active:           true,
      notes:               request.is_gift ? `Regalo de ${request.buyer_name}` : null,
    })
  }

  return NextResponse.json({ ok: true })
}

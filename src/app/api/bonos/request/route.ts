import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import {
  sendBonoRequestEmail,
  sendBuyerBonoConfirmationEmail,
  sendGiftBonoEmail,
} from '@/lib/brevo'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    bono_id,
    client_name,
    client_email,
    client_phone,
    is_gift = false,
    recipient_name,
    recipient_email,
  } = body

  if (!bono_id || !client_name || !client_email || !client_phone) {
    return NextResponse.json({ error: 'Nombre, email y teléfono son obligatorios' }, { status: 400 })
  }
  if (is_gift && (!recipient_name || !recipient_email)) {
    return NextResponse.json({ error: 'Indica el nombre y email del destinatario del regalo' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const [{ data: bono, error: bonoError }, { data: config }] = await Promise.all([
    supabase.from('bonos').select('*, services(name)').eq('id', bono_id).eq('is_active', true).single(),
    supabase.from('podologist_config').select('owner_email, business_name').eq('id', 1).maybeSingle(),
  ])

  if (bonoError || !bono) {
    return NextResponse.json({ error: 'Bono no encontrado' }, { status: 404 })
  }

  // Persist request
  const { data: request, error: insertErr } = await supabase
    .from('bono_requests')
    .insert({
      bono_id,
      buyer_name: client_name,
      buyer_email: client_email,
      buyer_phone: client_phone,
      is_gift,
      recipient_name: is_gift ? recipient_name : null,
      recipient_email: is_gift ? recipient_email : null,
      status: 'pending',
    })
    .select()
    .single()

  if (insertErr || !request) {
    return NextResponse.json({ error: 'Error al registrar la solicitud' }, { status: 500 })
  }

  const serviceName = (bono.services as { name: string } | null)?.name ?? null
  const businessName = config?.business_name ?? undefined

  // Fire all emails non-fatally
  const emailPayload = {
    bonoName: bono.name,
    bonoSessions: bono.total_sessions,
    bonoPrice: bono.price,
    serviceName,
    businessName,
    requestId: request.id,
  }

  const emailResults = await Promise.allSettled([
    // 1. Buyer confirmation
    sendBuyerBonoConfirmationEmail({
      ...emailPayload,
      buyerName: client_name,
      buyerEmail: client_email,
      isGift: is_gift,
      recipientName: is_gift ? recipient_name : null,
    }),
    // 2. Gift recipient notification
    ...(is_gift && recipient_email ? [
      sendGiftBonoEmail({
        ...emailPayload,
        recipientName: recipient_name,
        recipientEmail: recipient_email,
        buyerName: client_name,
      }),
    ] : []),
    // 3. Admin notification
    ...(config?.owner_email ? [
      sendBonoRequestEmail({
        adminEmail: config.owner_email,
        clientName: client_name,
        clientEmail: client_email,
        clientPhone: client_phone,
        ...emailPayload,
        isGift: is_gift,
        recipientName: is_gift ? recipient_name : null,
        recipientEmail: is_gift ? recipient_email : null,
      }),
    ] : []),
  ])

  emailResults.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[bono email ${i}] FAILED:`, r.reason)
    else console.log(`[bono email ${i}] OK:`, JSON.stringify(r.value))
  })

  return NextResponse.json({ ok: true, requestId: request.id })
}

import { NextRequest } from 'next/server'
import { sendWhatsApp } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const { type, clientName, clientPhone, appointmentTime } = await req.json()

  if (!type || !clientName || !clientPhone || !appointmentTime) {
    return Response.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const message =
    type === 'delay'
      ? `Hola ${clientName}, te escribimos desde Tru Barber. Tu cita es a las ${appointmentTime}, puede que haya un pequeño retraso. ¡Hasta ahora!`
      : `Hola ${clientName}, te esperamos en Tru Barber a las ${appointmentTime}. ¡Todo en orden, hasta ahora!`

  try {
    await sendWhatsApp(clientPhone, message)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[display/notify] Error enviando WhatsApp:', err)
    return Response.json({ error: 'Error enviando mensaje' }, { status: 500 })
  }
}

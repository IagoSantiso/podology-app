import { Resend } from 'resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'BarberApp <onboarding@resend.dev>'

interface AppointmentEmailData {
  clientName: string
  clientEmail: string
  serviceName: string
  appointmentDate: string
  startTime: string
  price: number | null
  appointmentId: string
  isGuest: boolean
}

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  const cancelUrl = `${process.env.NEXT_PUBLIC_URL}/cancel?id=${data.appointmentId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Georgia, serif; background:#0a0a0a; color:#f5f0e8; padding:40px 0; margin:0;">
      <div style="max-width:520px; margin:0 auto; background:#111; border:1px solid #333; border-radius:8px; padding:40px;">
        <h1 style="color:#d4a853; font-size:28px; margin-bottom:4px; letter-spacing:1px;">✂️ Cita confirmada</h1>
        <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong></p>

        <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:20px 24px; margin:24px 0; border-radius:4px;">
          <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Tu reserva</p>
          <p style="margin:0 0 6px; font-size:18px; font-weight:bold; color:#f5f0e8;">${data.serviceName}</p>
          <p style="margin:0 0 4px; color:#ccc;">${dateFormatted}</p>
          <p style="margin:0; color:#d4a853; font-size:20px; font-weight:bold;">${data.startTime.slice(0,5)}h</p>
          ${data.price ? `<p style="margin:8px 0 0; color:#999;">${data.price.toFixed(2)} €</p>` : ''}
        </div>

        ${data.isGuest ? `
        <div style="background:#1a1a0a; border:1px solid #d4a85340; padding:16px 20px; border-radius:4px; margin-bottom:24px;">
          <p style="margin:0; color:#d4a853; font-size:14px;">
            💡 <strong>¿Quieres ver tu historial de cortes?</strong><br>
            <span style="color:#999;">Crea una cuenta gratis y lleva el registro de todas tus visitas.</span>
          </p>
          <a href="${process.env.NEXT_PUBLIC_URL}/book/login" style="display:inline-block; margin-top:12px; color:#d4a853; font-size:13px;">Crear cuenta →</a>
        </div>
        ` : ''}

        <a href="${cancelUrl}" style="color:#666; font-size:13px; text-decoration:underline;">Cancelar esta cita</a>

        <hr style="border:none; border-top:1px solid #222; margin:32px 0 16px;">
        <p style="color:#555; font-size:12px; margin:0;">BarberApp · Si no solicitaste esta cita, ignora este email.</p>
      </div>
    </body>
    </html>
  `

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `✂️ Cita confirmada — ${data.startTime.slice(0,5)}h, ${dateFormatted}`,
    html,
  })
}

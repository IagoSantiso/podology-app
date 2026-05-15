import { Resend } from 'resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

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
  rescheduleToken: string
  isGuest: boolean
  businessName?: string
  businessAddress?: string
}

// ─── PDF receipt ─────────────────────────────────────────────────────────────

async function generatePdf(data: AppointmentEmailData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([420, 280])
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)

  const gold = rgb(0.83, 0.66, 0.33)
  const dark = rgb(0.07, 0.07, 0.07)
  const grey = rgb(0.55, 0.55, 0.55)
  const cream = rgb(0.96, 0.94, 0.91)

  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  // Background
  page.drawRectangle({ x: 0, y: 0, width: 420, height: 280, color: dark })

  // Gold accent bar
  page.drawRectangle({ x: 0, y: 0, width: 4, height: 280, color: gold })

  // Business name
  const biz = data.businessName ?? 'BarberApp'
  page.drawText(biz, { x: 24, y: 248, size: 18, font: helveticaBold, color: gold })

  // Title
  page.drawText('Confirmacion de cita', { x: 24, y: 222, size: 11, font: helvetica, color: grey })

  // Divider
  page.drawLine({ start: { x: 24, y: 212 }, end: { x: 396, y: 212 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) })

  // Service
  page.drawText('Servicio', { x: 24, y: 194, size: 9, font: helvetica, color: grey })
  page.drawText(data.serviceName, { x: 24, y: 178, size: 14, font: helveticaBold, color: cream })

  // Date + time
  page.drawText('Fecha y hora', { x: 24, y: 158, size: 9, font: helvetica, color: grey })
  page.drawText(dateFormatted, { x: 24, y: 142, size: 11, font: helvetica, color: cream })
  page.drawText(data.startTime.slice(0, 5) + 'h', { x: 24, y: 124, size: 16, font: helveticaBold, color: gold })

  // Price
  if (data.price) {
    page.drawText('Precio', { x: 260, y: 158, size: 9, font: helvetica, color: grey })
    page.drawText(data.price.toFixed(2) + ' EUR', { x: 260, y: 142, size: 14, font: helveticaBold, color: cream })
  }

  // Client
  page.drawText('Cliente', { x: 24, y: 100, size: 9, font: helvetica, color: grey })
  page.drawText(data.clientName, { x: 24, y: 84, size: 11, font: helvetica, color: cream })

  // Address
  if (data.businessAddress) {
    page.drawText(data.businessAddress, { x: 24, y: 36, size: 9, font: helvetica, color: grey })
  }

  // Footer
  page.drawText('Ref: ' + data.appointmentId, { x: 24, y: 18, size: 8, font: helvetica, color: rgb(0.35, 0.35, 0.35) })

  return doc.save()
}

// ─── Shared card HTML block ───────────────────────────────────────────────────

function appointmentCard(data: AppointmentEmailData, dateFormatted: string) {
  return `
    <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:20px 24px; margin:24px 0; border-radius:4px;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Tu reserva</p>
      <p style="margin:0 0 6px; font-size:18px; font-weight:bold; color:#f5f0e8;">${data.serviceName}</p>
      <p style="margin:0 0 4px; color:#ccc;">${dateFormatted}</p>
      <p style="margin:0; color:#d4a853; font-size:20px; font-weight:bold;">${data.startTime.slice(0, 5)}h</p>
      ${data.price ? `<p style="margin:8px 0 0; color:#999;">${data.price.toFixed(2)} €</p>` : ''}
    </div>
  `
}

function rescheduleBtn(token: string) {
  const url = `${process.env.NEXT_PUBLIC_URL}/reschedule?token=${token}`
  return `
    <a href="${url}" style="display:inline-block; margin-bottom:12px; background:#d4a853; color:#0a0a0a; font-weight:bold; font-size:14px; padding:12px 24px; border-radius:6px; text-decoration:none;">
      Modificar cita
    </a>
  `
}

function cancelLink(id: string) {
  const url = `${process.env.NEXT_PUBLIC_URL}/cancel?id=${id}`
  return `<a href="${url}" style="color:#666; font-size:13px; text-decoration:underline;">Cancelar esta cita</a>`
}

function emailWrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Georgia, serif; background:#0a0a0a; color:#f5f0e8; padding:40px 0; margin:0;">
      <div style="max-width:520px; margin:0 auto; background:#111; border:1px solid #333; border-radius:8px; padding:40px;">
        ${content}
        <hr style="border:none; border-top:1px solid #222; margin:32px 0 16px;">
        <p style="color:#555; font-size:12px; margin:0;">BarberApp · Si no solicitaste esta cita, ignora este email.</p>
      </div>
    </body>
    </html>
  `
}

// ─── Confirmation email ───────────────────────────────────────────────────────

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:28px; margin-bottom:4px; letter-spacing:1px;">✂️ Cita confirmada</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong></p>

    ${appointmentCard(data, dateFormatted)}

    ${data.isGuest ? `
    <div style="background:#1a1a0a; border:1px solid #d4a85340; padding:16px 20px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; color:#d4a853; font-size:14px;">
        💡 <strong>¿Quieres ver tu historial de cortes?</strong><br>
        <span style="color:#999;">Crea una cuenta gratis y lleva el registro de todas tus visitas.</span>
      </p>
      <a href="${process.env.NEXT_PUBLIC_URL}/book/login" style="display:inline-block; margin-top:12px; color:#d4a853; font-size:13px;">Crear cuenta →</a>
    </div>
    ` : ''}

    <div style="margin-bottom:8px;">
      ${rescheduleBtn(data.rescheduleToken)}
    </div>
    ${cancelLink(data.appointmentId)}
  `)

  const pdfBytes = await generatePdf(data)

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `✂️ Cita confirmada — ${data.startTime.slice(0, 5)}h, ${dateFormatted}`,
    html,
    attachments: [{
      filename: 'cita-confirmada.pdf',
      content: Buffer.from(pdfBytes).toString('base64'),
    }],
  })
}

// ─── Reminder email (first — with reschedule button) ─────────────────────────

export async function sendReminderEmailFirst(data: AppointmentEmailData) {
  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">⏰ Recordatorio de cita</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong> — te recordamos tu próxima cita.</p>

    ${appointmentCard(data, dateFormatted)}

    <div style="margin-bottom:8px;">
      ${rescheduleBtn(data.rescheduleToken)}
    </div>
    ${cancelLink(data.appointmentId)}
  `)

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `⏰ Recordatorio — mañana a las ${data.startTime.slice(0, 5)}h`,
    html,
  })
}

// ─── Bono request email (to admin) ───────────────────────────────────────────

export async function sendBonoRequestEmail({
  adminEmail,
  clientName,
  clientEmail,
  clientPhone,
  bonoName,
  bonoSessions,
  bonoPrice,
  serviceName,
  isGift,
  recipientName,
  recipientEmail,
  requestId,
}: {
  adminEmail: string
  clientName: string
  clientEmail: string
  clientPhone: string
  bonoName: string
  bonoSessions: number
  bonoPrice: number | null
  serviceName: string | null
  isGift?: boolean
  recipientName?: string | null
  recipientEmail?: string | null
  requestId?: string
}) {
  const giftBlock = isGift && recipientName ? `
    <div style="background:#1a1a1a; border:1px solid #d4a85340; padding:14px 18px; border-radius:4px; margin-top:12px;">
      <p style="margin:0 0 4px; color:#d4a853; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Es un regalo para</p>
      <p style="margin:0; color:#f5f0e8; font-size:14px; font-weight:bold;">${recipientName}</p>
      ${recipientEmail ? `<p style="margin:2px 0 0; color:#999; font-size:13px;">${recipientEmail}</p>` : ''}
    </div>` : ''

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">${isGift ? '🎁 Solicitud de bono regalo' : '🎟️ Solicitud de bono'}</h1>
    <p style="color:#999; margin-top:0;">Un cliente ha solicitado la compra de un bono.</p>

    <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:20px 24px; margin:24px 0; border-radius:4px;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Bono solicitado</p>
      <p style="margin:0 0 6px; font-size:18px; font-weight:bold; color:#f5f0e8;">${bonoName}</p>
      <p style="margin:0 0 4px; color:#ccc;">${bonoSessions} sesiones · ${serviceName ?? 'Todos los servicios'}</p>
      ${bonoPrice != null ? `<p style="margin:8px 0 0; color:#d4a853; font-size:18px; font-weight:bold;">${bonoPrice.toFixed(2)} €</p>` : ''}
    </div>

    <div style="background:#1a1a1a; border:1px solid #333; padding:20px 24px; border-radius:4px;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Comprador</p>
      <p style="margin:0 0 4px; color:#f5f0e8;"><strong>Nombre:</strong> ${clientName}</p>
      <p style="margin:0 0 4px; color:#f5f0e8;"><strong>Email:</strong> ${clientEmail}</p>
      <p style="margin:0; color:#f5f0e8;"><strong>Teléfono:</strong> ${clientPhone}</p>
      ${giftBlock}
    </div>

    <p style="color:#999; font-size:13px; margin-top:24px;">
      Ve a <strong>Comercial → Solicitudes</strong> en el panel admin para marcar el bono como pagado una vez recibido el pago.
      ${requestId ? `<br><span style="color:#555;">Ref: ${requestId}</span>` : ''}
    </p>
  `)

  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `${isGift ? '🎁' : '🎟️'} Solicitud de bono: ${bonoName} — ${clientName}`,
    html,
  })
}

// ─── Reschedule by barber email ──────────────────────────────────────────────

export async function sendRescheduleByBarberEmail(data: {
  clientName: string
  clientEmail: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  note?: string | null
}) {
  const fmtDT = (d: string, t: string) =>
    `${format(new Date(d + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })} · ${t.slice(0, 5)}h`

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">✂️ Tu cita ha sido modificada</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong></p>

    <div style="background:#1a1a1a; border-left:3px solid #555; padding:14px 20px; margin:16px 0; border-radius:4px; opacity:0.6;">
      <p style="margin:0 0 4px; color:#999; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Anterior</p>
      <p style="margin:0; color:#ccc; font-size:14px; text-decoration:line-through;">${fmtDT(data.oldDate, data.oldTime)}</p>
    </div>

    <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:14px 20px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 4px; color:#d4a853; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Nueva fecha</p>
      <p style="margin:0 0 4px; color:#f5f0e8; font-size:14px;">${data.serviceName}</p>
      <p style="margin:0; color:#d4a853; font-size:18px; font-weight:bold;">${fmtDT(data.newDate, data.newTime)}</p>
    </div>

    ${data.note ? `
    <div style="background:#111; border:1px solid #333; padding:14px 18px; border-radius:4px; margin-bottom:20px;">
      <p style="margin:0 0 6px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Nota del barbero</p>
      <p style="margin:0; color:#f5f0e8; font-size:14px;">${data.note}</p>
    </div>` : ''}

    <p style="color:#666; font-size:13px;">Si tienes dudas, contacta directamente con la barbería.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `✂️ Tu cita ha sido modificada — ahora ${fmtDT(data.newDate, data.newTime)}`,
    html,
  })
}

// ─── Cancellation by barber email ─────────────────────────────────────────────

export async function sendCancelByBarberEmail(data: {
  clientName: string
  clientEmail: string
  serviceName: string
  appointmentDate: string
  startTime: string
  note?: string | null
}) {
  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  const html = emailWrapper(`
    <h1 style="color:#f87171; font-size:24px; margin-bottom:4px; letter-spacing:1px;">Tu cita ha sido cancelada</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong> — lamentamos los inconvenientes.</p>

    <div style="background:#1a1a1a; border-left:3px solid #555; padding:20px 24px; margin:24px 0; border-radius:4px; opacity:0.7;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Cita cancelada</p>
      <p style="margin:0 0 6px; font-size:16px; font-weight:bold; color:#f5f0e8;">${data.serviceName}</p>
      <p style="margin:0 0 4px; color:#ccc;">${dateFormatted}</p>
      <p style="margin:0; color:#999; font-size:18px; font-weight:bold;">${data.startTime.slice(0, 5)}h</p>
    </div>

    ${data.note ? `
    <div style="background:#111; border:1px solid #333; padding:14px 18px; border-radius:4px; margin-bottom:20px;">
      <p style="margin:0 0 6px; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Nota del barbero</p>
      <p style="margin:0; color:#f5f0e8; font-size:14px;">${data.note}</p>
    </div>` : ''}

    <p style="color:#666; font-size:13px;">Puedes reservar una nueva cita cuando quieras en nuestra web.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `Tu cita del ${dateFormatted} ha sido cancelada`,
    html,
  })
}

// ─── Bono order PDF ──────────────────────────────────────────────────────────

async function generateBonoOrderPdf(data: {
  requestId: string
  bonoName: string
  bonoSessions: number
  bonoPrice: number | null
  serviceName: string | null
  buyerName: string
  isGift: boolean
  recipientName?: string | null
  businessName?: string
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([420, 300])
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const gold  = rgb(0.83, 0.66, 0.33)
  const dark  = rgb(0.07, 0.07, 0.07)
  const grey  = rgb(0.55, 0.55, 0.55)
  const cream = rgb(0.96, 0.94, 0.91)
  const amber = rgb(0.97, 0.55, 0.13)

  page.drawRectangle({ x: 0, y: 0, width: 420, height: 300, color: dark })
  page.drawRectangle({ x: 0, y: 0, width: 4, height: 300, color: gold })

  const biz = data.businessName ?? 'BarberApp'
  page.drawText(biz, { x: 24, y: 268, size: 18, font: bold, color: gold })
  page.drawText('Orden de compra de bono', { x: 24, y: 244, size: 10, font: regular, color: grey })
  page.drawLine({ start: { x: 24, y: 234 }, end: { x: 396, y: 234 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) })

  page.drawText('Bono', { x: 24, y: 216, size: 9, font: regular, color: grey })
  page.drawText(data.bonoName, { x: 24, y: 200, size: 15, font: bold, color: cream })
  page.drawText(`${data.bonoSessions} sesiones · ${data.serviceName ?? 'Todos los servicios'}`, { x: 24, y: 182, size: 10, font: regular, color: grey })

  if (data.bonoPrice != null) {
    page.drawText('Importe', { x: 260, y: 216, size: 9, font: regular, color: grey })
    page.drawText(`${data.bonoPrice.toFixed(2)} EUR`, { x: 260, y: 200, size: 15, font: bold, color: gold })
  }

  page.drawText('Estado', { x: 24, y: 158, size: 9, font: regular, color: grey })
  page.drawText('PENDIENTE DE PAGO', { x: 24, y: 142, size: 11, font: bold, color: amber })

  page.drawText(data.isGift ? 'Comprador' : 'Cliente', { x: 24, y: 116, size: 9, font: regular, color: grey })
  page.drawText(data.buyerName, { x: 24, y: 100, size: 11, font: regular, color: cream })

  if (data.isGift && data.recipientName) {
    page.drawText('Destinatario del regalo', { x: 220, y: 116, size: 9, font: regular, color: grey })
    page.drawText(data.recipientName, { x: 220, y: 100, size: 11, font: regular, color: cream })
  }

  page.drawText('Ref: ' + data.requestId, { x: 24, y: 18, size: 8, font: regular, color: rgb(0.35, 0.35, 0.35) })

  return doc.save()
}

// ─── Buyer bono confirmation email ───────────────────────────────────────────

export async function sendBuyerBonoConfirmationEmail(data: {
  buyerName: string
  buyerEmail: string
  bonoName: string
  bonoSessions: number
  bonoPrice: number | null
  serviceName: string | null
  isGift: boolean
  recipientName?: string | null
  requestId: string
  businessName?: string
}) {
  const giftLine = data.isGift && data.recipientName
    ? `<p style="color:#999; margin-top:0;">El bono es un regalo para <strong style="color:#f5f0e8;">${data.recipientName}</strong>.</p>`
    : ''

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">🎟️ Solicitud recibida</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.buyerName}</strong> — hemos recibido tu solicitud.</p>
    ${giftLine}

    <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:20px 24px; margin:24px 0; border-radius:4px;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Bono solicitado</p>
      <p style="margin:0 0 6px; font-size:18px; font-weight:bold; color:#f5f0e8;">${data.bonoName}</p>
      <p style="margin:0 0 4px; color:#ccc;">${data.bonoSessions} sesiones · ${data.serviceName ?? 'Todos los servicios'}</p>
      ${data.bonoPrice != null ? `<p style="margin:8px 0 0; color:#d4a853; font-size:18px; font-weight:bold;">${data.bonoPrice.toFixed(2)} €</p>` : ''}
    </div>

    <div style="background:#1a1a0a; border:1px solid #d4a85340; padding:16px 20px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; color:#d4a853; font-size:14px; font-weight:bold;">Estado: Pendiente de pago</p>
      <p style="margin:6px 0 0; color:#999; font-size:13px;">Nos pondremos en contacto contigo para confirmar la compra y gestionar el pago. Adjuntamos el resguardo de tu solicitud en PDF.</p>
    </div>

    <p style="color:#666; font-size:13px;">Ref: ${data.requestId}</p>
  `)

  const pdfBytes = await generateBonoOrderPdf(data)

  return resend.emails.send({
    from: FROM,
    to: data.buyerEmail,
    subject: `🎟️ Solicitud de bono recibida — ${data.bonoName}`,
    html,
    attachments: [{
      filename: 'orden-bono.pdf',
      content: Buffer.from(pdfBytes).toString('base64'),
    }],
  })
}

// ─── Gift recipient bono email ────────────────────────────────────────────────

export async function sendGiftBonoEmail(data: {
  recipientName: string
  recipientEmail: string
  buyerName: string
  bonoName: string
  bonoSessions: number
  bonoPrice: number | null
  serviceName: string | null
  requestId: string
  businessName?: string
}) {
  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">🎁 Te han regalado un bono</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.recipientName}</strong> — <strong style="color:#f5f0e8;">${data.buyerName}</strong> te ha regalado un bono.</p>

    <div style="background:#1a1a1a; border-left:3px solid #d4a853; padding:20px 24px; margin:24px 0; border-radius:4px;">
      <p style="margin:0 0 8px; color:#999; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Tu regalo</p>
      <p style="margin:0 0 6px; font-size:18px; font-weight:bold; color:#f5f0e8;">${data.bonoName}</p>
      <p style="margin:0 0 4px; color:#ccc;">${data.bonoSessions} sesiones · ${data.serviceName ?? 'Todos los servicios'}</p>
      ${data.bonoPrice != null ? `<p style="margin:8px 0 0; color:#d4a853; font-size:18px; font-weight:bold;">${data.bonoPrice.toFixed(2)} €</p>` : ''}
    </div>

    <div style="background:#1a1a0a; border:1px solid #d4a85340; padding:16px 20px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; color:#d4a853; font-size:14px; font-weight:bold;">Pendiente de activación</p>
      <p style="margin:6px 0 0; color:#999; font-size:13px;">Una vez confirmado el pago, el bono quedará activo y podrás usarlo en tus próximas citas. Adjuntamos el resguardo en PDF.</p>
    </div>

    <p style="color:#666; font-size:13px;">Ref: ${data.requestId}</p>
  `)

  const pdfBytes = await generateBonoOrderPdf({
    requestId: data.requestId,
    bonoName: data.bonoName,
    bonoSessions: data.bonoSessions,
    bonoPrice: data.bonoPrice,
    serviceName: data.serviceName,
    buyerName: data.buyerName,
    isGift: true,
    recipientName: data.recipientName,
    businessName: data.businessName,
  })

  return resend.emails.send({
    from: FROM,
    to: data.recipientEmail,
    subject: `🎁 ${data.buyerName} te ha regalado: ${data.bonoName}`,
    html,
    attachments: [{
      filename: 'regalo-bono.pdf',
      content: Buffer.from(pdfBytes).toString('base64'),
    }],
  })
}

// ─── Reminder email (second — no reschedule button) ──────────────────────────

export async function sendReminderEmailSecond(data: AppointmentEmailData) {
  const dateFormatted = format(
    new Date(data.appointmentDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  const html = emailWrapper(`
    <h1 style="color:#d4a853; font-size:24px; margin-bottom:4px; letter-spacing:1px;">⏰ Tu cita es pronto</h1>
    <p style="color:#999; margin-top:0;">Hola, <strong style="color:#f5f0e8;">${data.clientName}</strong> — te esperamos en breve.</p>

    ${appointmentCard(data, dateFormatted)}

    ${cancelLink(data.appointmentId)}
  `)

  return resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `⏰ Tu cita es hoy a las ${data.startTime.slice(0, 5)}h`,
    html,
  })
}

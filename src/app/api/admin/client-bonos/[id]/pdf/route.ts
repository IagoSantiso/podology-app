import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const W = 595.28
const H = 841.89
const ML = 50
const MR = W - 50

// Sanitize text to WinAnsiEncoding-safe characters
function safe(text: string): string {
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/€/g, 'EUR')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createSupabaseAdmin()

  const { data: cb, error } = await supabase
    .from('client_bonos')
    .select('*, bonos(name, total_sessions, price, services(name))')
    .eq('id', id)
    .single()

  if (error || !cb) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const { data: config } = await supabase
    .from('podologist_config')
    .select('business_name')
    .single()

  const businessName = safe(config?.business_name ?? 'Patricia Podologia')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bonoData = cb.bonos as any
  const bonoName = safe(bonoData?.name ?? 'Bono de sesiones')
  const totalSessions: number = cb.total_sessions
  const price: number | null = bonoData?.price ?? null
  const serviceName = safe(bonoData?.services?.name ?? 'Todos los servicios')
  const clientName = safe(cb.client_name)
  const clientEmail = safe(cb.client_email)
  const clientPhone = cb.client_phone ? safe(cb.client_phone) : null
  const purchaseDate = new Date(cb.purchased_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const shortId = cb.id.slice(0, 8).toUpperCase()

  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const PRIMARY = rgb(0.11, 0.28, 0.23)
  const PRIMARY_LIGHT = rgb(0.76, 0.9, 0.85)
  const INK = rgb(0.1, 0.1, 0.1)
  const INK3 = rgb(0.45, 0.45, 0.45)
  const LINE = rgb(0.85, 0.85, 0.85)
  const WHITE = rgb(1, 1, 1)

  // ── PAGE 1: Resumen del vale ─────────────────────────────────────────────
  const p1 = doc.addPage([W, H])

  // Header bar
  p1.drawRectangle({ x: 0, y: H - 85, width: W, height: 85, color: PRIMARY })

  // Business name in header
  p1.drawText(businessName.toUpperCase(), {
    x: ML, y: H - 38, size: 17, font: bold, color: WHITE,
  })
  p1.drawText('PODOLOGIA', {
    x: ML, y: H - 56, size: 9, font: regular, color: PRIMARY_LIGHT,
  })

  // "VALE DE BONO" pill on right
  p1.drawRectangle({
    x: MR - 110, y: H - 70, width: 110, height: 26,
    color: WHITE,
  })
  p1.drawText('VALE DE BONO', {
    x: MR - 100, y: H - 60, size: 9, font: bold, color: PRIMARY,
  })

  // Bono title
  p1.drawText(bonoName, { x: ML, y: H - 122, size: 20, font: bold, color: INK })
  p1.drawText(`${totalSessions} sesiones  |  ${serviceName}`, {
    x: ML, y: H - 144, size: 10, font: regular, color: INK3,
  })

  // Divider
  p1.drawLine({ start: { x: ML, y: H - 158 }, end: { x: MR, y: H - 158 }, thickness: 0.75, color: LINE })

  // — Client section —
  let y = H - 183
  p1.drawText('DATOS DEL TITULAR', { x: ML, y, size: 7.5, font: bold, color: INK3 })
  y -= 18

  const label = (text: string, ly: number) =>
    p1.drawText(text, { x: ML, y: ly, size: 8.5, font: bold, color: INK3 })
  const value = (text: string, ly: number) =>
    p1.drawText(text, { x: ML + 65, y: ly, size: 9.5, font: regular, color: INK })

  label('Nombre:', y); value(clientName, y); y -= 17
  label('Email:', y); value(clientEmail, y); y -= 17
  if (clientPhone) { label('Telefono:', y); value(clientPhone, y); y -= 17 }

  y -= 8
  p1.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: LINE })
  y -= 22

  // — Bono details section —
  p1.drawText('DETALLE DEL BONO', { x: ML, y, size: 7.5, font: bold, color: INK3 })
  y -= 18

  label('Bono:', y); value(bonoName, y); y -= 17
  label('Sesiones:', y); value(`${totalSessions} sesiones incluidas`, y); y -= 17
  if (price != null) {
    label('Importe:', y); value(`${Number(price).toFixed(2)} EUR`, y); y -= 17
  }
  label('Servicio:', y); value(serviceName, y); y -= 17

  y -= 8
  p1.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: LINE })
  y -= 22

  // — Purchase info section —
  p1.drawText('INFORMACION DE COMPRA', { x: ML, y, size: 7.5, font: bold, color: INK3 })
  y -= 18

  label('Fecha:', y); value(purchaseDate, y); y -= 17
  label('Referencia:', y); value(shortId, y); y -= 17

  if (cb.notes) {
    y -= 8
    p1.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: LINE })
    y -= 22
    p1.drawText('NOTAS', { x: ML, y, size: 7.5, font: bold, color: INK3 })
    y -= 17
    p1.drawText(safe(cb.notes), { x: ML, y, size: 9, font: regular, color: INK })
  }

  // Stamp box (bottom left)
  p1.drawRectangle({
    x: ML, y: 65, width: 200, height: 60,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: LINE, borderWidth: 0.75,
  })
  p1.drawText('SELLO / FIRMA', { x: ML + 10, y: 107, size: 7.5, font: bold, color: INK3 })

  p1.drawText(
    'Conserve este documento. Valido con sello del establecimiento.',
    { x: ML, y: 45, size: 7, font: regular, color: INK3 },
  )

  // ── PAGE 2: Registro de sesiones ─────────────────────────────────────────
  const p2 = doc.addPage([W, H])

  // Header bar
  p2.drawRectangle({ x: 0, y: H - 75, width: W, height: 75, color: PRIMARY })
  p2.drawText('REGISTRO DE SESIONES', {
    x: ML, y: H - 35, size: 15, font: bold, color: WHITE,
  })
  p2.drawText(`${bonoName}  |  ${clientName}`, {
    x: ML, y: H - 54, size: 8.5, font: regular, color: PRIMARY_LIGHT,
  })

  p2.drawText(
    'Recorte cada fila despues de cada sesion utilizada',
    { x: ML, y: H - 90, size: 8.5, font: regular, color: INK3 },
  )

  // Session rows
  const rowsTop = H - 108
  const rowsBottom = 55
  const rowH = (rowsTop - rowsBottom) / totalSessions

  for (let i = 0; i < totalSessions; i++) {
    const top = rowsTop - i * rowH
    const bot = top - rowH
    const mid = top - rowH * 0.5

    // Session circle
    p2.drawCircle({ x: ML + 13, y: mid, size: 11, color: PRIMARY })
    const num = String(i + 1)
    const numX = num.length === 1 ? ML + 9 : ML + 7
    p2.drawText(num, { x: numX, y: mid - 4, size: 8, font: bold, color: WHITE })

    // Fields row
    const fy = mid - 4
    const flColor = INK3
    const lineY = fy - 2

    p2.drawText('Fecha:', { x: ML + 32, y: fy, size: 7.5, font: bold, color: flColor })
    p2.drawLine({ start: { x: ML + 63, y: lineY }, end: { x: ML + 155, y: lineY }, thickness: 0.5, color: LINE })

    p2.drawText('Servicio:', { x: ML + 163, y: fy, size: 7.5, font: bold, color: flColor })
    p2.drawLine({ start: { x: ML + 200, y: lineY }, end: { x: ML + 320, y: lineY }, thickness: 0.5, color: LINE })

    p2.drawText('Sello/Firma:', { x: ML + 328, y: fy, size: 7.5, font: bold, color: flColor })
    p2.drawLine({ start: { x: ML + 385, y: lineY }, end: { x: MR, y: lineY }, thickness: 0.5, color: LINE })

    // Dashed cut line between rows
    if (i < totalSessions - 1) {
      p2.drawLine({
        start: { x: ML - 5, y: bot },
        end: { x: MR + 5, y: bot },
        thickness: 0.6,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: [4, 3],
        dashPhase: 0,
      })
    }
  }

  // Footer
  p2.drawText(`Ref: ${shortId}  |  ${businessName}`, {
    x: ML, y: 35, size: 7, font: regular, color: INK3,
  })

  const pdfBytes = await doc.save()
  const filename = `bono-${clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${shortId}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

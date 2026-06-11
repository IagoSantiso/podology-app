'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingData {
  serviceId: string
  serviceName: string
  serviceDescription: string | null
  servicePrice: number | null
  date: string
  time: string
}

interface GuestData {
  name: string
  email: string
  phone: string
}

function trunc(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 3) + '...' : text
}

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [guest, setGuest] = useState<GuestData | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const b = sessionStorage.getItem('booking')
    const g = sessionStorage.getItem('guest')
    if (b) setBooking(JSON.parse(b))
    if (g) setGuest(JSON.parse(g))
    sessionStorage.removeItem('booking')
    sessionStorage.removeItem('guest')
  }, [])

  async function handleDownloadPDF() {
    if (!booking) return
    setDownloading(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([420, 595])
      const { width, height } = page.getSize()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const green = rgb(0.04, 0.41, 0.33)
      const grayDark = rgb(0.15, 0.15, 0.15)
      const grayMid = rgb(0.45, 0.45, 0.45)
      const grayLight = rgb(0.88, 0.88, 0.88)
      const pad = 40

      let y = height - 50

      page.drawText('Patricia Podologia', { x: pad, y, font: bold, size: 16, color: green })
      y -= 18
      page.drawText('Confirmacion de cita', { x: pad, y, font, size: 10, color: grayMid })
      y -= 24

      page.drawLine({ start: { x: pad, y }, end: { x: width - pad, y }, thickness: 0.5, color: grayLight })
      y -= 22

      page.drawText('TRATAMIENTO', { x: pad, y, font: bold, size: 7.5, color: green })
      y -= 14
      page.drawText(trunc(booking.serviceName, 55), { x: pad, y, font: bold, size: 13, color: grayDark })
      y -= 15
      if (booking.serviceDescription) {
        page.drawText(trunc(booking.serviceDescription, 70), { x: pad, y, font, size: 9, color: grayMid })
        y -= 13
      }
      if (booking.servicePrice != null) {
        page.drawText(`${booking.servicePrice.toFixed(2)} EUR`, { x: pad, y, font: bold, size: 12, color: green })
        y -= 14
      }
      y -= 12

      page.drawLine({ start: { x: pad, y }, end: { x: width - pad, y }, thickness: 0.5, color: grayLight })
      y -= 22

      const rawDate = format(new Date(booking.date + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })
      const dateStr = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

      page.drawText('DIA', { x: pad, y, font: bold, size: 7.5, color: grayMid })
      page.drawText('HORA', { x: 220, y, font: bold, size: 7.5, color: grayMid })
      y -= 14
      page.drawText(trunc(dateStr, 30), { x: pad, y, font: bold, size: 11, color: grayDark })
      page.drawText(booking.time, { x: 220, y, font: bold, size: 18, color: grayDark })
      y -= 28

      if (guest) {
        page.drawLine({ start: { x: pad, y }, end: { x: width - pad, y }, thickness: 0.5, color: grayLight })
        y -= 22
        page.drawText('TUS DATOS', { x: pad, y, font: bold, size: 7.5, color: grayMid })
        y -= 14
        page.drawText(trunc(guest.name, 50), { x: pad, y, font: bold, size: 11, color: grayDark })
        y -= 13
        if (guest.email) {
          page.drawText(trunc(guest.email, 55), { x: pad, y, font, size: 9.5, color: grayMid })
          y -= 13
        }
        page.drawText(guest.phone, { x: pad, y, font, size: 9.5, color: grayMid })
        y -= 24
      }

      if (id) {
        page.drawLine({ start: { x: pad, y }, end: { x: width - pad, y }, thickness: 0.5, color: grayLight })
        y -= 18
        page.drawText(`Referencia: ${id.slice(0, 8).toUpperCase()}`, { x: pad, y, font, size: 8.5, color: grayMid })
      }

      page.drawText(
        'Las cancelaciones deben comunicarse con al menos 24 h de antelacion.',
        { x: pad, y: 28, font, size: 7.5, color: grayMid }
      )

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cita-${id ? id.slice(0, 8).toUpperCase() : 'confirmacion'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'var(--ok-soft)', border: '2px solid var(--ok)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)' }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="font-display italic text-4xl mb-3" style={{ color: 'var(--ink)' }}>¡Cita confirmada!</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          Te esperamos. Recibirás un recordatorio antes de la cita.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://calendar.google.com/calendar/r/eventedit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Añadir al calendario
          </a>

          {booking && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? 'Generando...' : 'Descargar confirmación PDF'}
            </button>
          )}

          <Link
            href="/book"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)' }}
          >
            Reservar otra cita
          </Link>

          <Link
            href="/book/login?action=signup"
            className="py-3 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            Crear cuenta para ver tu historial →
          </Link>
        </div>

        {id && (
          <p className="mt-8 text-xs tabular-nums" style={{ color: 'var(--line)' }}>
            Ref: {id.slice(0, 8).toUpperCase()}
          </p>
        )}

      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}

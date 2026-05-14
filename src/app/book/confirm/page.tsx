'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingData {
  serviceId: string
  serviceName: string
  servicePrice: number | null
  date: string
  time: string
}

interface GuestData {
  name: string
  email: string
  phone: string
}

export default function ConfirmPage() {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [guest, setGuest] = useState<GuestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const b = sessionStorage.getItem('booking')
    const g = sessionStorage.getItem('guest')
    if (!b) { router.replace('/book/select'); return }
    setBooking(JSON.parse(b))
    if (g) setGuest(JSON.parse(g))
  }, [router])

  async function handleConfirm() {
    if (!booking) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: guest?.name ?? 'Cliente',
        clientEmail: guest?.email ?? '',
        clientPhone: guest?.phone ?? '',
        serviceId: booking.serviceId,
        appointmentDate: booking.date,
        startTime: booking.time,
        isGuest: !!guest,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al confirmar'); setLoading(false); return }

    // Enviar email de confirmación (fire & forget)
    fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: data.appointment.id }),
    }).catch(() => {})

    sessionStorage.removeItem('booking')
    sessionStorage.removeItem('guest')
    router.push(`/book/success?id=${data.appointment.id}`)
  }

  if (!booking) return null

  const dateFormatted = format(
    new Date(booking.date + 'T00:00:00'),
    "EEEE d 'de' MMMM",
    { locale: es }
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/book/select" className="text-muted text-sm hover:text-gold transition-colors mb-8 inline-flex items-center gap-1">
          ← Cambiar
        </Link>

        <h1 className="font-display text-3xl font-bold text-cream mt-4 mb-8">Confirmar cita</h1>

        {/* Resumen */}
        <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
          <div className="border-l-2 border-gold pl-4 mb-6">
            <p className="text-xs text-muted uppercase tracking-widest mb-1">Servicio</p>
            <p className="text-cream font-semibold text-lg">{booking.serviceName}</p>
            {booking.servicePrice && (
              <p className="text-gold font-bold text-xl mt-0.5">{booking.servicePrice.toFixed(2)} €</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest mb-1">Día</p>
              <p className="text-cream font-medium capitalize">{dateFormatted}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-widest mb-1">Hora</p>
              <p className="text-cream font-bold text-2xl">{booking.time}h</p>
            </div>
          </div>
        </div>

        {/* Datos del cliente */}
        {guest && (
          <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">Tus datos</p>
            <p className="text-cream font-medium">{guest.name}</p>
            <p className="text-muted text-sm">{guest.email}</p>
            <p className="text-muted text-sm">{guest.phone}</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-4 transition-colors disabled:opacity-50"
        >
          {loading ? 'Confirmando...' : '✓ Confirmar cita'}
        </button>

        <p className="text-center text-xs text-muted mt-4">
          Recibirás un email de confirmación
        </p>
      </div>
    </main>
  )
}

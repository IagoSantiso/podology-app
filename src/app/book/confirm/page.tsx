'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase-client'

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

interface AuthProfile {
  id: string
  email: string
  name: string
  phone: string
}

const INPUT = "w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-colors"

export default function ConfirmPage() {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [guest, setGuest] = useState<GuestData | null>(null)
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [phone, setPhone] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const b = sessionStorage.getItem('booking')
    const g = sessionStorage.getItem('guest')
    if (!b) { router.replace('/book/select'); return }
    setBooking(JSON.parse(b))

    if (g) {
      setGuest(JSON.parse(g))
      setReady(true)
      return
    }

    // No guest data — resolve auth session
    const supabase = createSupabaseClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/book/login'); return }

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle()

      const resolvedPhone = profile?.phone ?? ''
      setAuthProfile({
        id: user.id,
        email: user.email ?? '',
        name: profile?.full_name ?? '',
        phone: resolvedPhone,
      })
      setPhone(resolvedPhone)
      setReady(true)
    })
  }, [router])

  async function handleConfirm() {
    if (!booking) return

    let clientName: string
    let clientEmail: string
    let clientPhone: string
    let clientUserId: string | undefined
    let isGuest: boolean

    if (guest) {
      clientName = guest.name
      clientEmail = guest.email
      clientPhone = guest.phone
      isGuest = true
      clientUserId = undefined
    } else if (authProfile) {
      const trimmedPhone = phone.trim()
      if (!trimmedPhone) { setError('El teléfono es obligatorio'); return }
      clientName = authProfile.name || authProfile.email
      clientEmail = authProfile.email
      clientPhone = trimmedPhone
      isGuest = false
      clientUserId = authProfile.id
    } else {
      router.replace('/book/login')
      return
    }

    setLoading(true); setError('')
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        clientEmail,
        clientPhone,
        serviceId: booking.serviceId,
        appointmentDate: booking.date,
        startTime: booking.time,
        isGuest,
        clientUserId,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al confirmar'); setLoading(false); return }

    // Persist newly entered phone to profile
    if (authProfile && !authProfile.phone && phone.trim()) {
      const supabase = createSupabaseClient()
      supabase
        .from('client_profiles')
        .upsert({ id: authProfile.id, phone: phone.trim() }, { onConflict: 'id' })
        .then(null, () => {})
    }

    fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: data.appointment.id }),
    }).catch(() => {})

    router.push(`/book/success?id=${data.appointment.id}`)
  }

  if (!booking || !ready) return null

  const dateFormatted = format(
    new Date(booking.date + 'T00:00:00'),
    "EEEE d 'de' MMMM",
    { locale: es }
  )

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        <Link href="/book/select" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Cambiar
        </Link>

        <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'var(--primary)' }}>Confirmar</p>
        <h1 className="font-display italic text-3xl mb-8" style={{ color: 'var(--ink)' }}>Tu cita</h1>

        {/* Resumen cita */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="border-l-2 pl-4 mb-5" style={{ borderColor: 'var(--primary)' }}>
            <p className="text-xs font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>Tratamiento</p>
            <p className="font-semibold text-lg" style={{ color: 'var(--ink)' }}>{booking.serviceName}</p>
            {booking.serviceDescription && (
              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--ink-3)' }}>{booking.serviceDescription}</p>
            )}
            {booking.servicePrice != null && (
              <p className="font-bold text-xl mt-0.5" style={{ color: 'var(--primary)' }}>
                {booking.servicePrice.toFixed(2)} €
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>Día</p>
              <p className="font-medium capitalize text-sm" style={{ color: 'var(--ink)' }}>{dateFormatted}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>Hora</p>
              <p className="font-display font-bold text-2xl" style={{ color: 'var(--ink)' }}>{booking.time}</p>
            </div>
          </div>
        </div>

        {/* Datos del cliente */}
        {(guest || authProfile) && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
            <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2.5" style={{ color: 'var(--ink-3)' }}>Tus datos</p>
            {guest ? (
              <>
                <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{guest.name}</p>
                {guest.email && <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{guest.email}</p>}
                <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{guest.phone}</p>
              </>
            ) : authProfile && (
              <>
                {authProfile.name && (
                  <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{authProfile.name}</p>
                )}
                <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{authProfile.email}</p>
                {authProfile.phone ? (
                  <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{authProfile.phone}</p>
                ) : (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>
                      Teléfono <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      autoComplete="tel"
                      className={INPUT}
                      style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Aviso cancelación */}
        <div className="flex items-start gap-2.5 rounded-xl p-3.5 mb-6" style={{ background: 'var(--warn-soft)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: 'var(--warn)' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--warn)' }}>
            Las cancelaciones deberán comunicarse con al menos <strong>24 horas de antelación</strong>.
          </p>
        </div>

        {error && <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-4 font-semibold text-base transition-opacity disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)' }}
        >
          {loading ? 'Confirmando...' : 'Confirmar cita'}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--ink-3)' }}>
          Recibirás un email de confirmación si indicaste tu dirección
        </p>

      </div>
    </main>
  )
}

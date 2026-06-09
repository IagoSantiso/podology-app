'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentInfo {
  id: string
  clientName: string
  serviceName: string
  price: number | null
  appointmentDate: string
  startTime: string
  durationMinutes: number
}

function RescheduleContent() {
  const params = useSearchParams()
  const token = params.get('token')

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)
  const [businessName, setBusinessName] = useState('PodologyApp')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'done' | 'error' | 'tooLate'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  // Load appointment info
  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('Enlace inválido'); return }

    fetch(`/api/reschedule?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.tooLate) { setState('tooLate'); setErrorMsg(d.error); return }
        if (d.error) { setState('error'); setErrorMsg(d.error); return }
        setAppointment(d.appointment)
        setBusinessName(d.config?.businessName ?? 'PodologyApp')
        setState('ready')
      })
      .catch(() => { setState('error'); setErrorMsg('Error de conexión') })
  }, [token])

  // Load slots when date changes
  useEffect(() => {
    if (state !== 'ready' || !token) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    fetch(`/api/reschedule?token=${token}&date=${selectedDate}`)
      .then(r => r.json())
      .then(d => { setSlots(d.slots ?? []); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [selectedDate, state, token])

  async function handleSubmit() {
    if (!selectedSlot || !token) return
    setSubmitting(true)
    const res = await fetch('/api/reschedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newDate: selectedDate, newStartTime: selectedSlot }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.tooLate) { setState('tooLate'); setErrorMsg(data.error); return }
    if (!res.ok) { setErrorMsg(data.error ?? 'No se pudo reagendar'); return }
    setState('done')
  }

  // Build date options: today + next 13 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, "EEE d MMM", { locale: es }) }
  })

  if (state === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </main>
    )
  }

  if (state === 'done') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-6">✅</div>
        <h1 className="font-display text-2xl font-bold text-cream mb-3">Cita reagendada</h1>
        <p className="text-muted mb-2">Tu nueva cita es el <strong className="text-cream">{format(new Date(selectedDate + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}</strong> a las <strong className="text-gold">{selectedSlot}h</strong>.</p>
        <p className="text-muted text-sm mb-8">Recibirás un email de confirmación con todos los detalles.</p>
        <Link href="/book" className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3 px-8 transition-colors">
          Volver al inicio
        </Link>
      </main>
    )
  }

  if (state === 'tooLate') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-6">⏳</div>
        <h1 className="font-display text-2xl font-bold text-cream mb-3">Plazo expirado</h1>
        <p className="text-muted mb-8">{errorMsg}</p>
        <Link href="/book" className="border border-border hover:border-gold text-cream rounded-xl py-3 px-8 text-sm transition-colors">
          Volver al inicio
        </Link>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-6">❌</div>
        <h1 className="font-display text-2xl font-bold text-cream mb-3">Enlace inválido</h1>
        <p className="text-muted mb-8">{errorMsg}</p>
        <Link href="/book" className="border border-border hover:border-gold text-cream rounded-xl py-3 px-8 text-sm transition-colors">
          Volver al inicio
        </Link>
      </main>
    )
  }

  const currentDateLabel = format(new Date(appointment!.appointmentDate + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })

  return (
    <main className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <span className="text-4xl block mb-3">✂️</span>
        <h1 className="font-display text-3xl font-bold text-gold tracking-wide">{businessName}</h1>
      </div>

      <h2 className="font-display text-xl font-bold text-cream mb-1">Modificar cita</h2>
      <p className="text-muted text-sm mb-6">Elige un nuevo horario para tu cita</p>

      {/* Current appointment */}
      <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Cita actual</p>
        <p className="font-semibold text-cream">{appointment!.serviceName}</p>
        <p className="text-muted text-sm capitalize">{currentDateLabel} · {appointment!.startTime.slice(0, 5)}h</p>
        {appointment!.price && <p className="text-muted text-sm">{appointment!.price.toFixed(2)} €</p>}
      </div>

      {/* Date selector */}
      <div className="mb-5">
        <p className="text-sm text-muted mb-3">Selecciona la nueva fecha</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {dateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedDate(opt.value)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                selectedDate === opt.value
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border text-cream hover:border-gold/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slot selector */}
      <div className="mb-6">
        <p className="text-sm text-muted mb-3">Selecciona el horario</p>
        {loadingSlots ? (
          <p className="text-muted text-sm">Cargando horarios...</p>
        ) : slots.length === 0 ? (
          <p className="text-muted text-sm">No hay horarios disponibles para este día</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedSlot === slot
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-cream hover:border-gold/50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selectedSlot || submitting}
        className="w-full bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-4 transition-colors disabled:opacity-50 text-base"
      >
        {submitting ? 'Reagendando...' : 'Confirmar nuevo horario'}
      </button>
    </main>
  )
}

export default function ReschedulePage() {
  return (
    <Suspense>
      <RescheduleContent />
    </Suspense>
  )
}

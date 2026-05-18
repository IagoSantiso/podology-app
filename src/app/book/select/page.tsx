'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, addDays, isBefore, startOfDay, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

interface Service { id: string; name: string; duration_minutes: number; price: number | null }

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function SelectPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [step, setStep] = useState<'service' | 'date' | 'time'>('service')

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => { if (d.services) setServices(d.services) })
      .catch(() => {})

    const today = startOfDay(new Date())
    const days: Date[] = []
    for (let i = 0; i < 60; i++) days.push(addDays(today, i))
    setCalendarDays(days)
  }, [])

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    fetch(`/api/slots?date=${dateStr}&serviceId=${selectedService.id}`)
      .then(r => r.json())
      .then(d => { setSlots(d.slots ?? []); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [selectedService, selectedDate])

  function handleContinue() {
    if (!selectedService || !selectedDate || !selectedSlot) return
    sessionStorage.setItem('booking', JSON.stringify({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedSlot,
    }))
    router.push('/book/confirm')
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/book/guest" className="text-muted text-sm hover:text-gold transition-colors mb-8 inline-flex items-center gap-1">
          ← Volver
        </Link>

        <h1 className="font-display text-3xl font-bold text-cream mt-4 mb-8">Tu cita</h1>

        {/* PASO 1: Servicio */}
        <section className="mb-8">
          <h2 className="text-xs text-muted uppercase tracking-widest mb-3">Servicio</h2>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s); setStep('date') }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors text-left
                  ${selectedService?.id === s.id
                    ? 'border-gold bg-gold/10 text-cream'
                    : 'border-border bg-bg-card text-cream hover:border-gold/50'}`}
              >
                <span className="font-medium">{s.name}</span>
                <div className="text-right">
                  {s.price && <span className="text-gold font-semibold">{s.price.toFixed(2)} €</span>}
                  <span className="block text-xs text-muted">{s.duration_minutes} min</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* PASO 2: Fecha */}
        {selectedService && (
          <section className="mb-8">
            <h2 className="text-xs text-muted uppercase tracking-widest mb-3">Fecha</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {calendarDays.map(d => {
                const isSelected = selectedDate && format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setSelectedDate(d); setStep('time') }}
                    className={`flex-shrink-0 flex flex-col items-center py-3 px-3 rounded-xl border transition-colors min-w-[56px]
                      ${isSelected
                        ? 'border-gold bg-gold/10 text-cream'
                        : 'border-border bg-bg-card text-cream hover:border-gold/50'}`}
                  >
                    <span className="text-xs text-muted">{DAYS_ES[d.getDay()]}</span>
                    <span className="text-lg font-semibold mt-0.5">{d.getDate()}</span>
                    <span className="text-xs text-muted">{format(d, 'MMM', { locale: es })}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* PASO 3: Hora */}
        {selectedService && selectedDate && (
          <section className="mb-8">
            <h2 className="text-xs text-muted uppercase tracking-widest mb-3">Hora</h2>
            {loadingSlots ? (
              <p className="text-muted text-sm">Cargando horas disponibles...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted text-sm">No hay horas disponibles este día</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-colors
                      ${selectedSlot === slot
                        ? 'border-gold bg-gold text-bg'
                        : 'border-border bg-bg-card text-cream hover:border-gold/50'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selectedService || !selectedDate || !selectedSlot}
          className="w-full bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-4 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Confirmar cita →
        </button>
      </div>
    </main>
  )
}

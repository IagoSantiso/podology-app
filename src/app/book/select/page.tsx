'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, addDays, startOfDay } from 'date-fns'
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

  const step = selectedService ? (selectedDate ? (selectedSlot ? 3 : 2) : 2) : 1

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md mx-auto">

        <Link href="/book/login" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </Link>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {['Tratamiento', 'Día', 'Hora'].map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={done
                      ? { background: 'var(--ok)', color: '#fff' }
                      : active
                      ? { background: 'var(--primary)', color: '#fff' }
                      : { background: 'var(--line)', color: 'var(--ink-3)' }
                    }
                  >
                    {done ? '✓' : n}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: active ? 'var(--ink)' : done ? 'var(--ok)' : 'var(--ink-3)' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <span className="flex-1 h-px w-4" style={{ background: 'var(--line)' }}/>}
              </div>
            )
          })}
        </div>

        {/* PASO 1: Servicio */}
        <section className="mb-8">
          <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--primary)' }}>Tratamiento</p>
          <div className="flex flex-col gap-2">
            {services.map(s => {
              const sel = selectedService?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className="flex items-center justify-between p-4 rounded-2xl text-left transition-all"
                  style={sel
                    ? { background: 'var(--primary-soft)', border: '1.5px solid var(--primary)' }
                    : { background: 'var(--card)', border: '1px solid var(--line)' }
                  }
                >
                  <span className="font-semibold text-sm" style={{ color: sel ? 'var(--primary-deep)' : 'var(--ink)' }}>{s.name}</span>
                  <div className="text-right ml-4">
                    {s.price != null && (
                      <span className="font-bold text-base block" style={{ color: sel ? 'var(--primary)' : 'var(--ink-2)' }}>
                        {s.price.toFixed(2)} €
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--ink-3)' }}>{s.duration_minutes} min</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* PASO 2: Fecha */}
        {selectedService && (
          <section className="mb-8">
            <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--primary)' }}>Día</p>
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {calendarDays.map(d => {
                const isSelected = selectedDate && format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d)}
                    className="flex-shrink-0 flex flex-col items-center py-3 px-3 rounded-xl transition-all min-w-[56px]"
                    style={isSelected
                      ? { background: 'var(--primary)', border: '1.5px solid var(--primary)' }
                      : { background: 'var(--card)', border: '1px solid var(--line)' }
                    }
                  >
                    <span className="text-[10px] font-semibold" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--ink-3)' }}>
                      {DAYS_ES[d.getDay()]}
                    </span>
                    <span className="text-lg font-bold mt-0.5" style={{ color: isSelected ? '#fff' : 'var(--ink)' }}>
                      {d.getDate()}
                    </span>
                    <span className="text-[10px]" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--ink-3)' }}>
                      {format(d, 'MMM', { locale: es })}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* PASO 3: Hora */}
        {selectedService && selectedDate && (
          <section className="mb-8">
            <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--primary)' }}>Hora</p>
            {loadingSlots ? (
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Cargando horas disponibles...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No hay horas disponibles este día</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => {
                  const sel = selectedSlot === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={sel
                        ? { background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)' }
                        : { background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line)' }
                      }
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selectedService || !selectedDate || !selectedSlot}
          className="w-full py-4 font-semibold text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)' }}
        >
          Continuar →
        </button>

      </div>
    </main>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addDays, subDays, startOfWeek, addWeeks, subWeeks,
  isToday, parse, addMinutes, isBefore, isSameDay, parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Service { id: string; name: string; duration_minutes: number; price: number | null }
interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  start_time: string
  end_time: string
  appointment_date: string
  status: string
  delay_minutes: number | null
  delay_notified: boolean
  services: Service | null
}

// Timeline 8:00 – 21:00 in 30-min steps
const SLOTS: string[] = []
for (let h = 8; h <= 20; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 20) SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-gold/15 border-gold/40',
  delayed:   'bg-orange-500/15 border-orange-500/40',
  completed: 'bg-green-700/15 border-green-700/40',
  cancelled: 'bg-border/30 border-border',
}

function slotToMin(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

function aptCoversSlot(apt: Appointment, slot: string): boolean {
  const s = slotToMin(slot)
  const start = slotToMin(apt.start_time)
  const end = slotToMin(apt.end_time)
  return s >= start && s < end
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dayApts, setDayApts] = useState<Appointment[]>([])
  const [weekApts, setWeekApts] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null)
  const [createForm, setCreateForm] = useState({ client_name: '', client_email: '', client_phone: '', service_id: '', time: '' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [delayModal, setDelayModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [delayMinutes, setDelayMinutes] = useState(15)
  const [completeModal, setCompleteModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [barberNotes, setBarberNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Notifications
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const lastCheckedRef = useRef(new Date())

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const loadDay = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/appointments?date=${dateStr}`)
    if (res.status === 401) { router.push('/admin'); return }
    const d = await res.json()
    setDayApts(d.appointments ?? [])
    setLoading(false)
  }, [dateStr, router])

  const loadWeek = useCallback(async () => {
    const end = addDays(weekStart, 6)
    const res = await fetch(`/api/admin/appointments?startDate=${format(weekStart, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`)
    if (res.ok) {
      const d = await res.json()
      setWeekApts(d.appointments ?? [])
    }
  }, [weekStart])

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services ?? []))
    fetch('/api/admin/availability').then(r => r.json()).then(d => setAvailability(d.availability ?? []))
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [])

  useEffect(() => { loadDay() }, [loadDay])
  useEffect(() => { loadWeek() }, [loadWeek])

  // Poll for new appointments when notifications granted
  useEffect(() => {
    if (notifPermission !== 'granted') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/appointments?date=${format(new Date(), 'yyyy-MM-dd')}&since=${lastCheckedRef.current.toISOString()}`)
      if (res.ok) {
        const { appointments: fresh } = await res.json()
        if (fresh?.length > 0) {
          for (const apt of fresh) {
            new Notification('Nueva cita', {
              body: `${apt.client_name} — ${apt.start_time?.slice(0, 5)}h | ${apt.services?.name ?? ''}`,
            })
          }
        }
      }
      lastCheckedRef.current = new Date()
    }, 60_000)
    return () => clearInterval(interval)
  }, [notifPermission])

  async function requestNotif() {
    const p = await Notification.requestPermission()
    setNotifPermission(p)
  }

  // Working hours for selected day
  const avail = availability.find(a => a.day_of_week === selectedDate.getDay())
  const workStart = avail ? slotToMin(avail.start_time) : null
  const workEnd = avail ? slotToMin(avail.end_time) : null

  function isWorkingSlot(slot: string) {
    if (workStart === null || workEnd === null) return false
    const m = slotToMin(slot)
    return m >= workStart && m < workEnd
  }

  // Build slot map for day view
  function getSlotApt(slot: string): Appointment | null {
    return dayApts.find(a => a.status !== 'cancelled' && aptCoversSlot(a, slot)) ?? null
  }

  // Week strip: count confirmed appointments per day
  function countForDay(d: Date): number {
    const ds = format(d, 'yyyy-MM-dd')
    return weekApts.filter(a => a.appointment_date === ds && a.status !== 'cancelled').length
  }

  // Urgency banner
  const now = new Date()
  const upcomingUrgent = isToday(selectedDate) && dayApts.some(a => {
    if (a.status !== 'confirmed') return false
    const aptTime = parse(a.start_time, 'HH:mm:ss', now)
    return isBefore(now, aptTime) && isBefore(aptTime, addMinutes(now, 60))
  })

  const todayActive = isToday(selectedDate) && dayApts.some(a => a.status === 'confirmed')

  async function patchApt(id: string, updates: Record<string, unknown>) {
    setActionLoading(true)
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await loadDay()
    await loadWeek()
    setActionLoading(false)
  }

  async function sendDelay() {
    if (!delayModal) return
    setActionLoading(true)
    await fetch('/api/delay-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: delayModal.aptId, delayMinutes }),
    })
    setDelayModal(null)
    await loadDay()
    setActionLoading(false)
  }

  async function markComplete() {
    if (!completeModal) return
    await patchApt(completeModal.aptId, { status: 'completed', barber_notes: barberNotes || null })
    setCompleteModal(null)
    setBarberNotes('')
  }

  function openCreate(slot: string) {
    setCreateForm({ client_name: '', client_email: '', client_phone: '', service_id: services[0]?.id ?? '', time: slot })
    setCreateError('')
    setCreateModal({ date: dateStr, time: slot })
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!createForm.client_name || !createForm.client_phone || !createForm.service_id) {
      setCreateError('Nombre, teléfono y servicio son obligatorios')
      return
    }
    setCreateLoading(true)
    const res = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...createForm,
        client_email: createForm.client_email || 'sinEmail@barberia.local',
        appointment_date: createModal!.date,
        start_time: createForm.time,
      }),
    })
    const data = await res.json()
    setCreateLoading(false)
    if (!res.ok) { setCreateError(data.error ?? 'Error al crear'); return }
    setCreateModal(null)
    await loadDay()
    await loadWeek()
  }

  // Previous slot to detect continuation
  function prevSlot(slot: string): string | null {
    const idx = SLOTS.indexOf(slot)
    return idx > 0 ? SLOTS[idx - 1] : null
  }

  return (
    <main className="min-h-screen px-3 py-6 max-w-2xl mx-auto">
      {/* Notification banner */}
      {notifPermission === 'default' && 'Notification' in window && (
        <div className="flex items-center justify-between bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-cream">Activa las notificaciones para nuevas citas</span>
          <button onClick={requestNotif} className="text-gold font-medium hover:underline ml-2 shrink-0">Activar</button>
        </div>
      )}

      {/* Urgency banner */}
      {upcomingUrgent && (
        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-xl px-4 py-3 mb-4 text-yellow-300 text-sm">
          ⚠️ Tienes una cita en menos de 1 hora
        </div>
      )}

      {/* "Voy tarde" button */}
      {todayActive && (
        <button
          onClick={() => {
            const next = dayApts.find(a => a.status === 'confirmed')
            if (next) setDelayModal({ aptId: next.id, clientName: next.client_name })
          }}
          className="w-full mb-5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl py-3.5 transition-colors"
        >
          🕐 Voy a llegar tarde
        </button>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekStart(w => subWeeks(w, 1))} className="text-muted hover:text-cream p-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-xs text-muted">
          {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
        </span>
        <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="text-muted hover:text-cream p-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d, i) => {
          const count = countForDay(d)
          const selected = isSameDay(d, selectedDate)
          const today = isToday(d)
          return (
            <button
              key={i}
              onClick={() => { setSelectedDate(d); if (!isSameDay(startOfWeek(d, { weekStartsOn: 1 }), weekStart)) setWeekStart(startOfWeek(d, { weekStartsOn: 1 })) }}
              className={`flex flex-col items-center py-2 rounded-xl border transition-colors ${
                selected ? 'border-gold bg-gold/15 text-gold' :
                today ? 'border-gold/30 bg-gold/5 text-cream' :
                'border-border bg-bg-card text-muted hover:border-gold/40 hover:text-cream'
              }`}
            >
              <span className="text-[10px] font-medium">{WEEK_DAYS[i]}</span>
              <span className="text-base font-bold leading-tight">{format(d, 'd')}</span>
              {count > 0 ? (
                <span className={`text-[9px] font-bold mt-0.5 ${selected ? 'text-gold' : 'text-gold/60'}`}>{count}</span>
              ) : <span className="text-[9px] mt-0.5">·</span>}
            </button>
          )
        })}
      </div>

      {/* Selected day header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-cream capitalize">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          {isToday(selectedDate) && <span className="text-xs text-gold">Hoy</span>}
        </div>
        <button
          onClick={() => openCreate(avail ? avail.start_time.slice(0, 5) : '09:00')}
          className="flex items-center gap-1.5 bg-gold hover:bg-gold-dark text-bg text-sm font-semibold rounded-lg px-3 py-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva cita
        </button>
      </div>

      {/* Day timeline */}
      {loading ? (
        <p className="text-muted text-center py-12">Cargando...</p>
      ) : (
        <div className="flex flex-col">
          {SLOTS.map((slot) => {
            const apt = getSlotApt(slot)
            const prev = prevSlot(slot)
            const prevApt = prev ? getSlotApt(prev) : null
            const isContinuation = apt && prevApt === apt
            const isStart = apt && !isContinuation
            const working = isWorkingSlot(slot)
            const showHour = slot.endsWith(':00')

            return (
              <div key={slot} className="flex gap-2 min-h-[44px]">
                {/* Time label */}
                <div className="w-12 shrink-0 flex items-start justify-end pt-1">
                  {showHour && <span className="text-[11px] text-muted">{slot}</span>}
                </div>

                {/* Separator line + content */}
                <div className={`flex-1 border-l-2 pl-2 ${showHour ? 'border-border' : 'border-border/30'}`}>
                  {isStart ? (
                    <div className={`border rounded-xl px-3 py-2 mb-1 ${STATUS_COLOR[apt.status] ?? STATUS_COLOR.confirmed}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-cream font-semibold text-sm leading-tight">{apt.client_name}</p>
                          <p className="text-muted text-xs">{apt.services?.name} · {apt.start_time.slice(0,5)}–{apt.end_time.slice(0,5)}</p>
                          {apt.client_phone && <p className="text-muted text-[11px] mt-0.5">{apt.client_phone}</p>}
                        </div>
                        {apt.services?.price && (
                          <span className="text-gold text-xs font-semibold shrink-0">{Number(apt.services.price).toFixed(0)}€</span>
                        )}
                      </div>
                      {apt.status === 'confirmed' && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <button onClick={() => setCompleteModal({ aptId: apt.id, clientName: apt.client_name })} disabled={actionLoading}
                            className="text-[11px] bg-green-700/20 text-green-300 border border-green-700/40 rounded-md px-2 py-1 hover:bg-green-700/40 transition-colors">
                            ✓ Completar
                          </button>
                          <button onClick={() => setDelayModal({ aptId: apt.id, clientName: apt.client_name })} disabled={actionLoading}
                            className="text-[11px] bg-orange-700/20 text-orange-300 border border-orange-700/40 rounded-md px-2 py-1 hover:bg-orange-700/40 transition-colors">
                            ↷ Retraso
                          </button>
                          <button onClick={() => patchApt(apt.id, { status: 'cancelled' })} disabled={actionLoading}
                            className="text-[11px] bg-red-900/20 text-red-400 border border-red-900/40 rounded-md px-2 py-1 hover:bg-red-900/40 transition-colors">
                            ✕
                          </button>
                        </div>
                      )}
                      {apt.status === 'delayed' && (
                        <p className="text-[11px] text-orange-300 mt-1">
                          Retraso {apt.delay_minutes}min · {apt.delay_notified ? 'Cliente avisado' : 'Sin avisar'}
                        </p>
                      )}
                      {apt.status === 'completed' && <p className="text-[11px] text-green-400 mt-1">Completada</p>}
                    </div>
                  ) : isContinuation ? (
                    <div className={`h-full min-h-[40px] border-l-2 ml-3 ${STATUS_COLOR[apt.status]?.includes('gold') ? 'border-gold/30' : 'border-orange-500/30'}`} />
                  ) : (
                    <button
                      onClick={() => openCreate(slot)}
                      className={`w-full text-left py-1 px-2 rounded text-[11px] transition-colors ${
                        working
                          ? 'text-border hover:text-gold/60 hover:bg-gold/5'
                          : 'text-border/40 hover:text-border hover:bg-border/5'
                      }`}
                    >
                      {working ? '+ añadir cita' : ''}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Create appointment modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold text-cream mb-4">Nueva cita</h2>
            <form onSubmit={submitCreate} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Nombre cliente *</label>
                <input value={createForm.client_name} onChange={e => setCreateForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Carlos García" className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream placeholder-muted text-sm focus:outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">Teléfono *</label>
                  <input type="tel" value={createForm.client_phone} onChange={e => setCreateForm(p => ({ ...p, client_phone: e.target.value }))}
                    placeholder="+34 600..." className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream placeholder-muted text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Email</label>
                  <input type="email" value={createForm.client_email} onChange={e => setCreateForm(p => ({ ...p, client_email: e.target.value }))}
                    placeholder="opcional" className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream placeholder-muted text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">Servicio *</label>
                  <select value={createForm.service_id} onChange={e => setCreateForm(p => ({ ...p, service_id: e.target.value }))}
                    className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold">
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Hora *</label>
                  <input type="time" value={createForm.time} onChange={e => setCreateForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setCreateModal(null)} className="flex-1 border border-border text-muted rounded-xl py-3 text-sm">Cancelar</button>
                <button type="submit" disabled={createLoading} className="flex-1 bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
                  {createLoading ? 'Guardando...' : 'Añadir cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay modal */}
      {delayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm">
            <h2 className="font-display text-xl font-bold text-cream mb-1">Avisar retraso</h2>
            <p className="text-muted text-sm mb-4">WhatsApp a <span className="text-cream">{delayModal.clientName}</span></p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {[10, 15, 20, 30, 45].map(m => (
                <button key={m} onClick={() => setDelayMinutes(m)}
                  className={`flex-1 min-w-[50px] py-2 rounded-lg border text-sm font-medium transition-colors ${delayMinutes === m ? 'border-gold bg-gold/10 text-gold' : 'border-border text-cream hover:border-gold/50'}`}>
                  {m} min
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDelayModal(null)} className="flex-1 border border-border text-muted rounded-xl py-3 text-sm">Cancelar</button>
              <button onClick={sendDelay} disabled={actionLoading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
                {actionLoading ? 'Enviando...' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm">
            <h2 className="font-display text-xl font-bold text-cream mb-1">Completar cita</h2>
            <p className="text-muted text-sm mb-3">{completeModal.clientName}</p>
            <label className="block text-xs text-muted mb-1">Notas del corte (opcional)</label>
            <textarea value={barberNotes} onChange={e => setBarberNotes(e.target.value)}
              placeholder="Ej: Fade 2 lados, tijera 4cm arriba..." rows={3}
              className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream placeholder-muted text-sm focus:outline-none focus:border-gold resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setCompleteModal(null); setBarberNotes('') }} className="flex-1 border border-border text-muted rounded-xl py-3 text-sm">Cancelar</button>
              <button onClick={markComplete} disabled={actionLoading} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
                {actionLoading ? 'Guardando...' : '✓ Completar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

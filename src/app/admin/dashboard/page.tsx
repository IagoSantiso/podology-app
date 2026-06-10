'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addDays, startOfWeek, addWeeks, subWeeks, isToday, isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import BrandHeader from '@/components/admin/BrandHeader'

interface Service { id: string; name: string; duration_minutes: number; price: number | null }
interface Appointment {
  id: string; client_name: string; client_email: string; client_phone: string
  start_time: string; end_time: string; appointment_date: string
  service_id: string; status: string; delay_minutes: number | null; delay_notified: boolean
  services: Service | null
}

const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function slotToMin(s: string) { const [h, m] = s.split(':').map(Number); return h * 60 + m }

const INPUT = "w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
const BTN_GHOST = "flex-1 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
const BTN_PRIMARY = "flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dayApts, setDayApts] = useState<Appointment[]>([])
  const [weekApts, setWeekApts] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list'|'timeline'>('list')
  const [openAptId, setOpenAptId] = useState<string | null>(null)

  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null)
  const [createForm, setCreateForm] = useState({ client_name: '', client_email: '', client_phone: '', service_id: '', time: '' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [delayModal, setDelayModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [delayMinutes, setDelayMinutes] = useState(15)

  const [completeModal, setCompleteModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [podologistNotes, setPodologistNotes] = useState('')

  const [editModal, setEditModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [editForm, setEditForm] = useState({ date: '', time: '', service_id: '', reschedule_note: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [cancelModal, setCancelModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [cancelNote, setCancelNote] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [mounted, setMounted] = useState(false)
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
    if (res.ok) { const d = await res.json(); setWeekApts(d.appointments ?? []) }
  }, [weekStart])

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services ?? []))
    fetch('/api/admin/availability').then(r => r.json()).then(d => setAvailability(d.availability ?? []))
    if ('Notification' in window) setNotifPermission(Notification.permission)
    setMounted(true)
  }, [])

  useEffect(() => { loadDay() }, [loadDay])
  useEffect(() => { loadWeek() }, [loadWeek])

  useEffect(() => {
    if (notifPermission !== 'granted') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/appointments?date=${format(new Date(), 'yyyy-MM-dd')}&since=${lastCheckedRef.current.toISOString()}`)
      if (res.ok) {
        const { appointments: fresh } = await res.json()
        if (fresh?.length > 0) {
          for (const apt of fresh) {
            new Notification('Nueva cita', { body: `${apt.client_name} — ${apt.start_time?.slice(0, 5)}h | ${apt.services?.name ?? ''}` })
          }
        }
      }
      lastCheckedRef.current = new Date()
    }, 60_000)
    return () => clearInterval(interval)
  }, [notifPermission])

  async function requestNotif() { const p = await Notification.requestPermission(); setNotifPermission(p) }

  const sorted = useMemo(() => [...dayApts].sort((a,b) => a.start_time.localeCompare(b.start_time)), [dayApts])

  const now = new Date()
  const nowMin = now.getHours()*60 + now.getMinutes()
  const nextConfirmed = useMemo(() => {
    if (!isToday(selectedDate)) return sorted.find(a => a.status === 'confirmed') ?? null
    return sorted.find(a => a.status === 'confirmed' && slotToMin(a.start_time) >= nowMin) ?? null
  }, [sorted, selectedDate, nowMin])

  const upcomingUrgent = isToday(selectedDate) && nextConfirmed
    && (slotToMin(nextConfirmed.start_time) - nowMin) < 60
    && (slotToMin(nextConfirmed.start_time) - nowMin) > 0

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 6000) }

  async function patchApt(id: string, updates: Record<string, unknown>) {
    setActionLoading(true)
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    })
    const data = await res.json().catch(() => ({}))
    if (data.emailWarning) showToast(data.emailWarning)
    await loadDay(); await loadWeek()
    setActionLoading(false)
  }

  async function sendDelay() {
    if (!delayModal) return
    setActionLoading(true)
    await fetch('/api/delay-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: delayModal.aptId, delayMinutes }),
    })
    setDelayModal(null); await loadDay(); setActionLoading(false)
  }

  async function markComplete() {
    if (!completeModal) return
    await patchApt(completeModal.aptId, { status: 'completed', podologist_notes: podologistNotes || null })
    setCompleteModal(null); setPodologistNotes('')
  }

  function openCreate(slot: string) {
    setCreateForm({ client_name: '', client_email: '', client_phone: '', service_id: services[0]?.id ?? '', time: slot })
    setCreateError('')
    setCreateModal({ date: dateStr, time: slot })
  }

  function openEdit(apt: Appointment) {
    setEditForm({ date: apt.appointment_date, time: apt.start_time.slice(0, 5), service_id: apt.service_id ?? '', reschedule_note: '' })
    setEditError('')
    setEditModal({ aptId: apt.id, clientName: apt.client_name })
    setOpenAptId(null)
  }

  function openCancel(apt: Appointment) {
    setCancelNote('')
    setCancelModal({ aptId: apt.id, clientName: apt.client_name })
    setOpenAptId(null)
  }

  async function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setCreateError('')
    if (!createForm.client_name || !createForm.client_phone || !createForm.service_id) {
      setCreateError('Nombre, teléfono y servicio son obligatorios'); return
    }
    setCreateLoading(true)
    const res = await fetch('/api/admin/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createForm, client_email: createForm.client_email || 'sinEmail@podologia.local', appointment_date: createModal!.date, start_time: createForm.time }),
    })
    const data = await res.json()
    setCreateLoading(false)
    if (!res.ok) { setCreateError(data.error ?? 'Error al crear'); return }
    setCreateModal(null)
    if (data.emailWarning) showToast(data.emailWarning)
    await loadDay(); await loadWeek()
  }

  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editModal) return
    setEditError(''); setEditLoading(true)
    const res = await fetch(`/api/admin/appointments/${editModal.aptId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_date: editForm.date, start_time: editForm.time, service_id: editForm.service_id || undefined, reschedule_note: editForm.reschedule_note || null }),
    })
    const data = await res.json()
    setEditLoading(false)
    if (!res.ok) { setEditError(data.error ?? 'Error al guardar'); return }
    setEditModal(null)
    if (data.emailWarning) showToast(data.emailWarning)
    await loadDay(); await loadWeek()
  }

  async function submitCancel() {
    if (!cancelModal) return
    setActionLoading(true)
    const res = await fetch(`/api/admin/appointments/${cancelModal.aptId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', cancel_note: cancelNote || null }),
    })
    const data = await res.json().catch(() => ({}))
    setCancelModal(null); setCancelNote('')
    if (data.emailWarning) showToast(data.emailWarning)
    await loadDay(); await loadWeek()
    setActionLoading(false)
  }

  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayActive = isToday(selectedDate) && nextConfirmed

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto" style={{ background: 'var(--bg)' }}>
      <BrandHeader section="Agenda" />

      {/* Day header + view toggle */}
      <div className="px-5 pt-5 flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'var(--primary)' }}>
            {isToday(selectedDate) ? 'Hoy' : DAY_SHORT[selectedDate.getDay()]} · {format(selectedDate, 'd MMM', { locale: es })}
          </div>
          <h1 className="font-display italic text-[30px] leading-none capitalize" style={{ color: 'var(--ink)' }}>
            {format(selectedDate, 'EEEE', { locale: es })}{' '}
            <span style={{ color: 'var(--primary)' }}>{format(selectedDate, 'd')}</span>
          </h1>
          <div className="font-display italic text-[17px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
            de {format(selectedDate, 'MMMM', { locale: es })}
          </div>
        </div>
        <div className="flex rounded-xl p-0.5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          <button onClick={() => setView('list')}
            className="w-[30px] h-[28px] rounded-lg inline-flex items-center justify-center transition-colors"
            style={view === 'list' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--ink-3)' }}>
            <ListIcon className="w-[15px] h-[15px]" />
          </button>
          <button onClick={() => setView('timeline')}
            className="w-[30px] h-[28px] rounded-lg inline-flex items-center justify-center transition-colors"
            style={view === 'timeline' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--ink-3)' }}>
            <GridIcon className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setWeekStart(w => subWeeks(w,1))} className="p-1 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>‹</button>
          <span className="flex-1 text-center text-[10px] tracking-widest uppercase self-center" style={{ color: 'var(--ink-3)' }}>
            {format(weekStart, 'd MMM', { locale: es })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w,1))} className="p-1 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>›</button>
        </div>
        <div className="flex gap-1.5">
          {week.map((d,i) => {
            const is = isSameDay(d, selectedDate)
            const today = isToday(d)
            const count = weekApts.filter(a => a.appointment_date === format(d,'yyyy-MM-dd') && a.status !== 'cancelled').length
            return (
              <button key={i} onClick={() => setSelectedDate(d)}
                className="flex-1 flex flex-col items-center py-2 rounded-xl transition-colors"
                style={is
                  ? { background: 'var(--primary)', border: '1.5px solid var(--primary)' }
                  : today
                  ? { background: 'var(--card)', border: '1.5px solid var(--primary)' }
                  : { background: 'var(--card)', border: '1px solid var(--line)' }
                }>
                <span className="text-[9px] tracking-widest uppercase font-bold" style={{ color: is ? 'rgba(255,255,255,0.75)' : 'var(--ink-3)' }}>
                  {DAY_SHORT[d.getDay()]}
                </span>
                <span className="font-display font-bold text-[17px] leading-none mt-0.5" style={{ color: is ? '#fff' : today ? 'var(--primary)' : 'var(--ink)' }}>
                  {format(d,'d')}
                </span>
                <span className="text-[8px] font-bold mt-0.5"
                  style={{ color: is ? 'rgba(255,255,255,0.7)' : count > 0 ? 'var(--primary)' : 'transparent' }}>
                  {count > 0 ? `${count}` : '·'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notif banner */}
      {mounted && notifPermission === 'default' && 'Notification' in window && (
        <div className="mx-5 mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--info-soft)', border: '1px solid var(--primary)' }}>
          <span style={{ color: 'var(--primary-deep)' }}>Activa las notificaciones para nuevas citas</span>
          <button onClick={requestNotif} className="font-semibold ml-2 shrink-0" style={{ color: 'var(--primary)' }}>Activar</button>
        </div>
      )}

      {/* Urgent banner */}
      {upcomingUrgent && nextConfirmed && (
        <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)' }}>
          <AlertIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />
          <div className="flex-1 leading-tight">
            <div className="text-[12.5px] font-semibold" style={{ color: 'var(--warn)' }}>
              Próxima cita en {slotToMin(nextConfirmed.start_time) - nowMin} minutos
            </div>
            <div className="text-[11px]" style={{ color: 'var(--warn)' }}>
              {nextConfirmed.client_name} · {nextConfirmed.start_time.slice(0,5)}h
            </div>
          </div>
        </div>
      )}

      {/* CTA "Voy a llegar tarde" */}
      {todayActive && nextConfirmed && (
        <div className="px-5 pt-3">
          <button onClick={() => setDelayModal({ aptId: nextConfirmed.id, clientName: nextConfirmed.client_name })}
            className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
            style={{ background: 'var(--warn)', color: '#fff' }}>
            <ClockIcon className="w-4 h-4" />
            Voy a llegar tarde
            <span className="font-display italic font-normal opacity-80 text-xs">
              · avisar a {nextConfirmed.client_name.split(' ')[0]}
            </span>
          </button>
        </div>
      )}

      {/* Section header */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>
          {isToday(selectedDate) ? 'Hoy' : DAY_SHORT[selectedDate.getDay()]}
        </span>
        <span className="font-display italic text-sm" style={{ color: 'var(--ink-3)' }}>{sorted.length} citas</span>
        <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
      </div>

      {/* List or timeline */}
      <div className="px-5">
        {loading ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--ink-3)' }}>Cargando...</p>
        ) : view === 'list' ? (
          <div className="flex flex-col gap-2.5">
            {sorted.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} now={now}
                isNext={apt.id === nextConfirmed?.id}
                open={openAptId === apt.id}
                onToggle={() => setOpenAptId(openAptId === apt.id ? null : apt.id)}
                onDelay={() => setDelayModal({ aptId: apt.id, clientName: apt.client_name })}
                onComplete={() => setCompleteModal({ aptId: apt.id, clientName: apt.client_name })}
                onEdit={() => openEdit(apt)}
                onOpenCancel={() => openCancel(apt)}
                actionLoading={actionLoading}
              />
            ))}
            {sorted.length === 0 && (
              <div className="py-10 text-center font-display italic rounded-xl" style={{ color: 'var(--ink-3)', border: '1px dashed var(--line)' }}>
                Día sin citas
              </div>
            )}
          </div>
        ) : (
          <TimelineView appts={sorted} availability={availability} selectedDate={selectedDate} onCreate={openCreate} />
        )}
      </div>

      {/* End rule */}
      <div className="px-5 pt-6 flex items-center gap-3" style={{ color: 'var(--ink-3)' }}>
        <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
        <span className="font-display italic text-xs">fin del día</span>
        <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
      </div>

      {/* FAB */}
      <button
        onClick={() => openCreate(availability.find(a => a.day_of_week === selectedDate.getDay())?.start_time?.slice(0,5) ?? '09:00')}
        className="fixed bottom-24 right-4 z-30 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
        style={{ background: 'var(--primary)', color: '#fff', boxShadow: '0 8px 24px rgba(47,125,110,0.35), 0 0 0 4px rgba(47,125,110,0.08)' }}>
        <PlusIcon className="w-[14px] h-[14px]" />
      </button>

      {/* ── MODALS ── */}
      {createModal && (
        <Modal onClose={() => setCreateModal(null)} title="Nueva cita">
          <form onSubmit={submitCreate} className="flex flex-col gap-3">
            <Field label="Nombre del cliente">
              <input value={createForm.client_name} onChange={e => setCreateForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Ana García" className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Teléfono"><input type="tel" value={createForm.client_phone} onChange={e => setCreateForm(p => ({ ...p, client_phone: e.target.value }))} placeholder="+34 600..." className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/></Field>
              <Field label="Email"><input type="email" value={createForm.client_email} onChange={e => setCreateForm(p => ({ ...p, client_email: e.target.value }))} placeholder="opcional" className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/></Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Servicio">
                <select value={createForm.service_id} onChange={e => setCreateForm(p => ({ ...p, service_id: e.target.value }))} className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Hora"><input type="time" value={createForm.time} onChange={e => setCreateForm(p => ({ ...p, time: e.target.value }))} className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/></Field>
            </div>
            {createError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{createError}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setCreateModal(null)} className={BTN_GHOST} style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>Cancelar</button>
              <button type="submit" disabled={createLoading} className={BTN_PRIMARY} style={{ background: 'var(--primary)', color: '#fff' }}>{createLoading ? 'Guardando...' : 'Añadir cita'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editModal && (
        <Modal onClose={() => setEditModal(null)} title="Editar cita" subtitle={editModal.clientName}>
          <form onSubmit={submitEdit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Fecha"><input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/></Field>
              <Field label="Hora"><input type="time" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/></Field>
            </div>
            <Field label="Servicio">
              <select value={editForm.service_id} onChange={e => setEditForm(p => ({ ...p, service_id: e.target.value }))} className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Nota para el cliente (opcional)">
              <textarea value={editForm.reschedule_note} onChange={e => setEditForm(p => ({ ...p, reschedule_note: e.target.value }))}
                placeholder="Motivo del cambio..." rows={2} className={`${INPUT} resize-none text-[12.5px]`}
                style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
            </Field>
            <p className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Si el cliente tiene email, recibirá un aviso.</p>
            {editError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{editError}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setEditModal(null)} className={BTN_GHOST} style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>Cancelar</button>
              <button type="submit" disabled={editLoading} className={BTN_PRIMARY} style={{ background: 'var(--primary)', color: '#fff' }}>{editLoading ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </Modal>
      )}

      {delayModal && (
        <Modal onClose={() => setDelayModal(null)} title="Avisar retraso"
          subtitle={<>WhatsApp a <strong style={{ color: 'var(--ink)' }}>{delayModal.clientName}</strong></>}>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[10,15,20,30,45].map(m => (
              <button key={m} onClick={() => setDelayMinutes(m)}
                className="flex-1 min-w-[50px] py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={delayMinutes === m
                  ? { background: 'var(--warn-soft)', border: '1.5px solid var(--warn)', color: 'var(--warn)' }
                  : { background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }
                }>
                {m} min
              </button>
            ))}
          </div>
          <div className="rounded-xl p-2.5 text-[11.5px] leading-[1.55] mb-4" style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
            <div className="text-[9px] tracking-[0.18em] uppercase font-bold mb-1.5" style={{ color: 'var(--ink-3)' }}>Vista previa</div>
            Hola {delayModal.clientName.split(' ')[0]}, te aviso que hoy llegaré unos{' '}
            <strong style={{ color: 'var(--warn)' }}>{delayMinutes}</strong> minutos tarde. Disculpa las molestias 🙏
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDelayModal(null)} className={BTN_GHOST} style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>Cancelar</button>
            <button onClick={sendDelay} disabled={actionLoading} className={BTN_PRIMARY} style={{ background: 'var(--warn)', color: '#fff' }}>
              {actionLoading ? 'Enviando...' : 'Enviar aviso'}
            </button>
          </div>
        </Modal>
      )}

      {completeModal && (
        <Modal onClose={() => { setCompleteModal(null); setPodologistNotes('') }} title="Completar cita" subtitle={completeModal.clientName}>
          <Field label="Notas de la visita (opcional)">
            <textarea value={podologistNotes} onChange={e => setPodologistNotes(e.target.value)}
              placeholder="Tratamiento realizado, observaciones..." rows={3}
              className={`${INPUT} resize-none`}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
          </Field>
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setCompleteModal(null); setPodologistNotes('') }} className={BTN_GHOST} style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>Cancelar</button>
            <button onClick={markComplete} disabled={actionLoading} className={BTN_PRIMARY} style={{ background: 'var(--ok)', color: '#fff' }}>
              {actionLoading ? 'Guardando...' : '✓ Completar'}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm
          text-[12.5px] leading-snug rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', color: 'var(--warn)' }}>
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto shrink-0 transition-opacity hover:opacity-70">✕</button>
        </div>
      )}

      {cancelModal && (
        <Modal onClose={() => setCancelModal(null)} title="Cancelar cita" subtitle={cancelModal.clientName}>
          <p className="text-[12.5px] mb-3 -mt-1" style={{ color: 'var(--ink-3)' }}>
            ¿Seguro que quieres cancelar esta cita? El cliente recibirá un email si tiene dirección registrada.
          </p>
          <Field label="Nota para el cliente (opcional)">
            <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)}
              placeholder="Motivo de la cancelación..." rows={2}
              className={`${INPUT} resize-none text-[12.5px]`}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
          </Field>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setCancelModal(null)} className={BTN_GHOST} style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>Volver</button>
            <button onClick={submitCancel} disabled={actionLoading} className={BTN_PRIMARY} style={{ background: 'var(--danger)', color: '#fff' }}>
              {actionLoading ? 'Cancelando...' : 'Cancelar cita'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// AppointmentCard
// ─────────────────────────────────────────────────────────────
function AppointmentCard({ apt, now, isNext, open, onToggle, onDelay, onComplete, onEdit, onOpenCancel, actionLoading }: {
  apt: Appointment; now: Date; isNext: boolean; open: boolean;
  onToggle: () => void; onDelay: () => void; onComplete: () => void;
  onEdit: () => void; onOpenCancel: () => void; actionLoading: boolean;
}) {
  const nowMin = now.getHours()*60 + now.getMinutes()
  const todayStr = format(now, 'yyyy-MM-dd')
  const aptIsToday = apt.appointment_date === todayStr
  const aptIsPastDate = apt.appointment_date < todayStr
  const past = apt.status === 'completed' || aptIsPastDate || (aptIsToday && slotToMin(apt.end_time) < nowMin)
  const delayed = apt.status === 'delayed'
  const cancelled = apt.status === 'cancelled'

  const borderColor = isNext ? 'var(--primary)' : delayed ? 'var(--warn)' : 'var(--line)'
  const timeColor = isNext ? 'var(--primary)' : delayed ? 'var(--warn)' : 'var(--ink)'

  return (
    <div className="rounded-2xl overflow-hidden transition-shadow"
      style={{ background: 'var(--card)', border: `1px solid ${borderColor}`, opacity: past ? 0.65 : 1 }}>
      <button onClick={onToggle} className="w-full flex items-stretch gap-3 text-left px-3.5 py-3.5">
        <div className="flex flex-col items-start gap-0.5 px-0.5">
          <div className="font-display font-bold text-[22px] leading-none tabular-nums" style={{ color: timeColor }}>
            {apt.start_time.slice(0,5)}
          </div>
          <div className="text-[9px] font-medium tracking-wider" style={{ color: 'var(--ink-3)' }}>{apt.services?.duration_minutes} min</div>
        </div>
        <div className="w-px self-stretch" style={{ background: borderColor }}/>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: 'var(--ink)', textDecoration: cancelled ? 'line-through' : 'none' }}>
            {apt.client_name}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
            <span>{apt.services?.name}</span>
            <span style={{ color: 'var(--line)' }}>·</span>
            <span className="font-display italic" style={{ color: 'var(--primary)', fontSize: '12px' }}>
              {apt.services?.price ? `${Number(apt.services.price).toFixed(0)}€` : ''}
            </span>
          </div>
        </div>
        <StatusBadge apt={apt} isNext={isNext}/>
      </button>

      {open && !cancelled && (
        <div className="px-3.5 py-2.5 flex flex-wrap gap-1.5 items-center" style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="flex items-center gap-1.5 w-full text-[11px] mb-1" style={{ color: 'var(--ink-3)' }}>
            <PhoneIcon className="w-4 h-4"/><span className="tabular-nums">{apt.client_phone}</span>
          </div>
          {apt.status === 'confirmed' && (
            <>
              <Chip kind="ok"   onClick={onComplete}   disabled={actionLoading}>Completar</Chip>
              <Chip kind="warn" onClick={onDelay}      disabled={actionLoading}>Retraso</Chip>
              <Chip kind="edit" onClick={onEdit}       disabled={actionLoading}>Editar</Chip>
              <Chip kind="bad"  onClick={onOpenCancel} disabled={actionLoading}>✕</Chip>
            </>
          )}
          {(apt.status === 'delayed' || apt.status === 'completed') && (
            <Chip kind="edit" onClick={onEdit} disabled={actionLoading}>Editar</Chip>
          )}
        </div>
      )}

      {open && delayed && (
        <div className="px-3.5 py-2.5 flex items-center gap-2 text-[11.5px]"
          style={{ borderTop: '1px solid var(--line-2)', background: 'var(--warn-soft)', color: 'var(--warn)' }}>
          <ClockIcon className="w-3.5 h-3.5"/>
          Retraso de {apt.delay_minutes} min · {apt.delay_notified ? 'cliente avisado por WhatsApp' : 'sin avisar'}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ apt, isNext }: { apt: Appointment; isNext: boolean }) {
  let label = '—'
  let bg = 'transparent', color = 'var(--ink-3)', border = 'var(--line)'
  if (apt.status === 'completed') { label = '✓'; bg = 'var(--ok-soft)'; color = 'var(--ok)'; border = 'var(--ok)' }
  else if (apt.status === 'delayed') { label = `+${apt.delay_minutes}'`; bg = 'var(--warn-soft)'; color = 'var(--warn)'; border = 'var(--warn)' }
  else if (apt.status === 'cancelled') { label = '✕'; bg = 'var(--danger-soft)'; color = 'var(--danger)'; border = 'var(--danger)' }
  else if (isNext) { label = 'sig.'; bg = 'var(--primary-soft)'; color = 'var(--primary)'; border = 'var(--primary)' }
  return (
    <div className="self-start px-2 py-1 rounded-lg text-[9.5px] uppercase font-bold tracking-wider"
      style={{ background: bg, color, border: `1px solid ${border}` }}>{label}</div>
  )
}

function Chip({ kind, onClick, disabled, children }: {
  kind: 'ok'|'warn'|'bad'|'edit'; onClick:()=>void; disabled?:boolean; children:React.ReactNode
}) {
  const styles = {
    ok:   { bg: 'var(--ok-soft)',     color: 'var(--ok)',     border: 'var(--ok)' },
    warn: { bg: 'var(--warn-soft)',   color: 'var(--warn)',   border: 'var(--warn)' },
    bad:  { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger)' },
    edit: { bg: 'var(--primary-soft)',color: 'var(--primary)',border: 'var(--primary)' },
  }[kind]
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
      style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}>
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────
function TimelineView({ appts, availability, selectedDate, onCreate }: {
  appts: Appointment[]; availability: {day_of_week:number; start_time:string; end_time:string}[]; selectedDate: Date; onCreate: (slot:string)=>void;
}) {
  const avail = availability.find(a => a.day_of_week === selectedDate.getDay())
  const startH = avail ? parseInt(avail.start_time.slice(0,2)) : 9
  const endH   = avail ? parseInt(avail.end_time.slice(0,2)) : 20
  const hours: number[] = []
  for (let h = startH; h <= endH; h++) hours.push(h)

  return (
    <div className="flex flex-col">
      {hours.map(h => {
        const apt = appts.find(a => a.status !== 'cancelled' && slotToMin(a.start_time) <= h*60 && slotToMin(a.end_time) > h*60)
        const startsHere = apt && slotToMin(apt.start_time) === h*60
        return (
          <div key={h} className="flex gap-2.5 min-h-[56px]">
            <div className="w-11 pt-1 text-right font-display text-sm tabular-nums" style={{ color: 'var(--ink-3)' }}>
              {String(h).padStart(2,'0')}
            </div>
            <div className="flex-1 pl-2.5 pb-1.5" style={{ borderLeft: '1px solid var(--line)' }}>
              {startsHere && apt ? (
                <div className="rounded-xl px-3 py-2"
                  style={apt.status === 'completed'
                    ? { background: 'var(--ok-soft)', border: '1px solid var(--ok)' }
                    : apt.status === 'delayed'
                    ? { background: 'var(--warn-soft)', border: '1px solid var(--warn)' }
                    : { background: 'var(--primary-soft)', border: '1px solid var(--primary)' }
                  }>
                  <div className="font-semibold text-[13px]" style={{ color: 'var(--ink)' }}>{apt.client_name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{apt.services?.name} · {apt.start_time.slice(0,5)}–{apt.end_time.slice(0,5)}</div>
                </div>
              ) : apt ? (
                <div className="h-[38px] ml-1" style={{ borderLeft: '2px solid var(--primary)' }}/>
              ) : (
                <button onClick={() => onCreate(`${String(h).padStart(2,'0')}:00`)}
                  className="font-display italic pt-1 text-[10.5px] transition-opacity hover:opacity-80"
                  style={{ color: 'var(--ink-3)' }}>
                  + añadir
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Modal + helpers
// ─────────────────────────────────────────────────────────────
function Modal({ onClose, title, subtitle, children }: { onClose:()=>void; title:string; subtitle?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(28,40,38,0.5)', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-sm px-5 pt-5 pb-10 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', boxShadow: 'var(--shadow-lg)' }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-3 sm:hidden" style={{ background: 'var(--line)' }}/>
        <h2 className="font-display italic text-[22px] leading-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
        {subtitle && <div className="text-[12px] mt-0.5 mb-4" style={{ color: 'var(--ink-3)' }}>{subtitle}</div>}
        {!subtitle && <div className="mb-4"/>}
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-1.5" style={{ color: 'var(--ink-3)' }}>{label}</div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
function ListIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>)
}
function GridIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>)
}
function ClockIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>)
}
function AlertIcon({ className='', style={} }) {
  return (<svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>)
}
function PhoneIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)
}
function PlusIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
}

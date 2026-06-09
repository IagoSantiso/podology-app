'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addDays, startOfWeek, addWeeks, subWeeks,
  isToday, isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import BrandHeader from '@/components/admin/BrandHeader'

interface Service { id: string; name: string; duration_minutes: number; price: number | null }
interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  start_time: string
  end_time: string
  appointment_date: string
  service_id: string
  status: string
  delay_minutes: number | null
  delay_notified: boolean
  services: Service | null
}

const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function slotToMin(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
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
  const [view, setView] = useState<'list'|'timeline'>('list')
  const [openAptId, setOpenAptId] = useState<string | null>(null)

  // Create modal
  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null)
  const [createForm, setCreateForm] = useState({ client_name: '', client_email: '', client_phone: '', service_id: '', time: '' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Delay modal
  const [delayModal, setDelayModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [delayMinutes, setDelayMinutes] = useState(15)

  // Complete modal
  const [completeModal, setCompleteModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [podologistNotes, setPodologistNotes] = useState('')

  // Edit modal
  const [editModal, setEditModal] = useState<{ aptId: string; clientName: string } | null>(null)
  const [editForm, setEditForm] = useState({ date: '', time: '', service_id: '', reschedule_note: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Cancel modal
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
    if (res.ok) {
      const d = await res.json()
      setWeekApts(d.appointments ?? [])
    }
  }, [weekStart])

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services ?? []))
    fetch('/api/admin/availability').then(r => r.json()).then(d => setAvailability(d.availability ?? []))
    if ('Notification' in window) setNotifPermission(Notification.permission)
    setMounted(true)
  }, [])

  useEffect(() => { loadDay() }, [loadDay])
  useEffect(() => { loadWeek() }, [loadWeek])

  // Polling
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

  const sorted = useMemo(() =>
    [...dayApts].sort((a,b) => a.start_time.localeCompare(b.start_time))
  , [dayApts])

  // Bug fix: next confirmed = SIGUIENTE futura, no la PRIMERA del día
  const now = new Date()
  const nowMin = now.getHours()*60 + now.getMinutes()
  const nextConfirmed = useMemo(() => {
    if (!isToday(selectedDate)) return sorted.find(a => a.status === 'confirmed') ?? null
    return sorted.find(a => a.status === 'confirmed' && slotToMin(a.start_time) >= nowMin) ?? null
  }, [sorted, selectedDate, nowMin])

  const upcomingUrgent = isToday(selectedDate) && nextConfirmed
    && (slotToMin(nextConfirmed.start_time) - nowMin) < 60
    && (slotToMin(nextConfirmed.start_time) - nowMin) > 0

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 6000)
  }

  async function patchApt(id: string, updates: Record<string, unknown>) {
    setActionLoading(true)
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
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
    setEditForm({
      date: apt.appointment_date,
      time: apt.start_time.slice(0, 5),
      service_id: apt.service_id ?? apt.services?.id ?? '',
      reschedule_note: '',
    })
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
    e.preventDefault()
    setCreateError('')
    if (!createForm.client_name || !createForm.client_phone || !createForm.service_id) {
      setCreateError('Nombre, teléfono y servicio son obligatorios')
      return
    }
    setCreateLoading(true)
    const res = await fetch('/api/admin/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...createForm,
        client_email: createForm.client_email || 'sinEmail@podologia.local',
        appointment_date: createModal!.date,
        start_time: createForm.time,
      }),
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
    setEditError('')
    setEditLoading(true)
    const res = await fetch(`/api/admin/appointments/${editModal.aptId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_date: editForm.date,
        start_time: editForm.time,
        service_id: editForm.service_id || undefined,
        reschedule_note: editForm.reschedule_note || null,
      }),
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
    <main className="min-h-screen pb-24 max-w-2xl mx-auto">
      <BrandHeader section="Agenda" />

      {/* Day header + view toggle */}
      <div className="px-5 pt-[18px] flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-semibold tracking-[0.22em] uppercase text-gold mb-1">
            {isToday(selectedDate) ? 'Hoy' : DAY_SHORT[selectedDate.getDay()]} · {format(selectedDate, 'd MMM', { locale: es })}
          </div>
          <h1 className="font-display italic text-[32px] leading-none text-cream capitalize">
            {format(selectedDate, 'EEEE', { locale: es })} <span className="text-gold">{format(selectedDate, 'd')}</span>
          </h1>
          <div className="font-display italic text-[18px] text-muted mt-0.5">
            de {format(selectedDate, 'MMMM', { locale: es })}
          </div>
        </div>
        <div className="flex border border-border rounded-lg p-0.5 bg-bg-card">
          <button onClick={() => setView('list')} className={`w-[30px] h-[28px] rounded-md inline-flex items-center justify-center transition-colors ${view==='list' ? 'bg-gold text-bg' : 'text-muted'}`}>
            <ListIcon className="w-[15px] h-[15px]" />
          </button>
          <button onClick={() => setView('timeline')} className={`w-[30px] h-[28px] rounded-md inline-flex items-center justify-center transition-colors ${view==='timeline' ? 'bg-gold text-bg' : 'text-muted'}`}>
            <GridIcon className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setWeekStart(w => subWeeks(w,1))} className="text-muted p-1">‹</button>
          <span className="flex-1 text-center text-[10px] tracking-widest uppercase text-muted self-center">
            {format(weekStart, 'd MMM', { locale: es })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w,1))} className="text-muted p-1">›</button>
        </div>
        <div className="flex gap-1.5">
          {week.map((d,i) => {
            const is = isSameDay(d, selectedDate)
            const today = isToday(d)
            const count = weekApts.filter(a => a.appointment_date === format(d,'yyyy-MM-dd') && a.status !== 'cancelled').length
            return (
              <button key={i} onClick={() => setSelectedDate(d)}
                className={`flex-1 flex flex-col items-center py-2 rounded-md border transition-colors ${
                  is ? 'bg-gold border-gold text-bg'
                    : today ? 'border-gold/35 text-cream'
                    : 'border-border text-muted'
                }`}>
                <span className="text-[9px] tracking-widest uppercase font-semibold">{DAY_SHORT[d.getDay()]}</span>
                <span className="font-display font-semibold text-[17px] leading-none mt-0.5">{format(d,'d')}</span>
                <span className={`text-[8px] font-bold mt-0.5 ${is ? 'text-bg/70' : count > 0 ? 'text-gold' : 'text-muted/60'}`}>
                  {count > 0 ? `${count} citas` : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notification permission banner */}
      {mounted && notifPermission === 'default' && 'Notification' in window && (
        <div className="mx-5 mt-4 flex items-center justify-between rounded-lg px-4 py-3 text-sm bg-gold/10 border border-gold/30">
          <span className="text-cream">Activa las notificaciones para nuevas citas</span>
          <button onClick={requestNotif} className="text-gold font-medium ml-2 shrink-0">Activar</button>
        </div>
      )}

      {/* Urgent banner */}
      {upcomingUrgent && nextConfirmed && (
        <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-lg flex items-center gap-2.5
          bg-orange-500/[0.08] border border-orange-500/30 text-orange-300">
          <AlertIcon className="w-4 h-4 text-orange-400 shrink-0" />
          <div className="flex-1 leading-tight">
            <div className="text-[12.5px] font-semibold text-orange-200">
              Próxima cita en {slotToMin(nextConfirmed.start_time) - nowMin} minutos
            </div>
            <div className="text-[11px] text-orange-300/75">
              {nextConfirmed.client_name} · {nextConfirmed.start_time.slice(0,5)}h
            </div>
          </div>
        </div>
      )}

      {/* CTA "Voy a llegar tarde" */}
      {todayActive && nextConfirmed && (
        <div className="px-5 pt-3">
          <button
            onClick={() => setDelayModal({ aptId: nextConfirmed.id, clientName: nextConfirmed.client_name })}
            className="w-full px-4 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl
                       font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors
                       shadow-[0_6px_18px_rgba(224,131,68,0.18)]">
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
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gold">Hoy</span>
        <span className="font-display italic text-[13px] text-muted">{sorted.length} citas</span>
        <span className="flex-1 h-px bg-border/50" />
      </div>

      {/* List or timeline */}
      <div className="px-5">
        {loading ? (
          <p className="text-muted text-center py-12">Cargando...</p>
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
              <div className="py-10 text-center text-muted font-display italic border border-dashed border-border/50 rounded-xl">
                Día sin citas
              </div>
            )}
          </div>
        ) : (
          <TimelineView appts={sorted} availability={availability} selectedDate={selectedDate} onCreate={openCreate} />
        )}
      </div>

      {/* End rule */}
      <div className="px-5 pt-6 flex items-center gap-3 text-muted/60">
        <span className="flex-1 h-px bg-border/50" />
        <span className="font-display italic text-xs">fin del día</span>
        <span className="flex-1 h-px bg-border/50" />
      </div>

      {/* Floating + */}
      <button onClick={() => openCreate(availability.find(a => a.day_of_week === selectedDate.getDay())?.start_time?.slice(0,5) ?? '09:00')}
        className="fixed bottom-24 right-4 z-30 w-[52px] h-[52px] rounded-full bg-gold text-bg flex items-center justify-center
                   shadow-[0_8px_24px_rgba(212,168,83,0.35),0_0_0_4px_rgba(212,168,83,0.08)]">
        <PlusIcon className="w-[14px] h-[14px]" />
      </button>

      {/* ── MODALS ── */}

      {/* Create */}
      {createModal && (
        <Modal onClose={() => setCreateModal(null)} title="Nueva cita">
          <form onSubmit={submitCreate} className="flex flex-col gap-3">
            <Field label="Nombre del cliente">
              <input value={createForm.client_name} onChange={e => setCreateForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Carlos García" className={INPUT}/>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Teléfono"><input type="tel" value={createForm.client_phone} onChange={e => setCreateForm(p => ({ ...p, client_phone: e.target.value }))} placeholder="+34 600..." className={INPUT}/></Field>
              <Field label="Email"><input type="email" value={createForm.client_email} onChange={e => setCreateForm(p => ({ ...p, client_email: e.target.value }))} placeholder="opcional" className={INPUT}/></Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Servicio">
                <select value={createForm.service_id} onChange={e => setCreateForm(p => ({ ...p, service_id: e.target.value }))} className={INPUT}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Hora"><input type="time" value={createForm.time} onChange={e => setCreateForm(p => ({ ...p, time: e.target.value }))} className={INPUT}/></Field>
            </div>
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setCreateModal(null)} className={BTN_GHOST}>Cancelar</button>
              <button type="submit" disabled={createLoading} className={`${BTN_PRIMARY} bg-gold text-bg`}>{createLoading ? 'Guardando...' : 'Añadir cita'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit */}
      {editModal && (
        <Modal onClose={() => setEditModal(null)} title="Editar cita" subtitle={editModal.clientName}>
          <form onSubmit={submitEdit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Fecha"><input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} className={INPUT}/></Field>
              <Field label="Hora"><input type="time" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} className={INPUT}/></Field>
            </div>
            <Field label="Servicio">
              <select value={editForm.service_id} onChange={e => setEditForm(p => ({ ...p, service_id: e.target.value }))} className={INPUT}>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Nota para el cliente (opcional)">
              <textarea value={editForm.reschedule_note} onChange={e => setEditForm(p => ({ ...p, reschedule_note: e.target.value }))}
                placeholder="Motivo del cambio, disculpas..." rows={2} className={`${INPUT} resize-none text-[12.5px]`}/>
            </Field>
            <p className="text-[10.5px] text-muted -mt-1">Si el cliente tiene email, recibirá un aviso con los nuevos datos.</p>
            {editError && <p className="text-red-400 text-xs">{editError}</p>}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setEditModal(null)} className={BTN_GHOST}>Cancelar</button>
              <button type="submit" disabled={editLoading} className={`${BTN_PRIMARY} bg-gold text-bg`}>{editLoading ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delay */}
      {delayModal && (
        <Modal onClose={() => setDelayModal(null)} title="Avisar retraso"
          subtitle={<>WhatsApp a <span className="text-cream">{delayModal.clientName}</span></>}>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[10,15,20,30,45].map(m => (
              <button key={m} onClick={() => setDelayMinutes(m)}
                className={`flex-1 min-w-[50px] py-2.5 rounded-md text-sm font-semibold border transition-colors
                  ${delayMinutes === m ? 'border-gold bg-gold/10 text-gold' : 'border-border text-cream'}`}>
                {m} min
              </button>
            ))}
          </div>
          <div className="bg-bg-input border border-border/60 rounded-md p-2.5 text-[11.5px] text-cream/85 leading-[1.55] mb-4">
            <div className="text-[9px] tracking-[0.18em] uppercase text-muted mb-1.5 font-semibold">Vista previa</div>
            Hola {delayModal.clientName.split(' ')[0]}, te aviso que hoy llegaré unos <span className="text-gold">{delayMinutes}</span> minutos tarde. Disculpa las molestias 🙏
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDelayModal(null)} className={BTN_GHOST}>Cancelar</button>
            <button onClick={sendDelay} disabled={actionLoading} className={`${BTN_PRIMARY} bg-orange-600 text-white`}>{actionLoading ? 'Enviando...' : 'Enviar aviso'}</button>
          </div>
        </Modal>
      )}

      {/* Complete */}
      {completeModal && (
        <Modal onClose={() => { setCompleteModal(null); setPodologistNotes('') }} title="Completar cita" subtitle={completeModal.clientName}>
          <Field label="Notas de la visita (opcional)">
            <textarea value={podologistNotes} onChange={e => setPodologistNotes(e.target.value)}
              placeholder="Tratamiento de uña encarnada, pie derecho…" rows={3} className={`${INPUT} resize-none`}/>
          </Field>
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setCompleteModal(null); setPodologistNotes('') }} className={BTN_GHOST}>Cancelar</button>
            <button onClick={markComplete} disabled={actionLoading} className={`${BTN_PRIMARY} bg-green-700 text-white`}>{actionLoading ? 'Guardando...' : '✓ Completar'}</button>
          </div>
        </Modal>
      )}

      {/* Email warning toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm
          bg-orange-900/90 border border-orange-600/60 text-orange-200 text-[12.5px] leading-snug
          rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto shrink-0 text-orange-400 hover:text-orange-200">✕</button>
        </div>
      )}

      {/* Cancel with note */}
      {cancelModal && (
        <Modal onClose={() => setCancelModal(null)} title="Cancelar cita" subtitle={cancelModal.clientName}>
          <p className="text-[12.5px] text-muted mb-3 -mt-1">
            ¿Seguro que quieres cancelar esta cita? El cliente recibirá un email si tiene dirección registrada.
          </p>
          <Field label="Nota para el cliente (opcional)">
            <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)}
              placeholder="Motivo de la cancelación, disculpas..." rows={2} className={`${INPUT} resize-none text-[12.5px]`}/>
          </Field>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setCancelModal(null)} className={BTN_GHOST}>Volver</button>
            <button onClick={submitCancel} disabled={actionLoading}
              className={`${BTN_PRIMARY} bg-red-700 text-white`}>
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
function AppointmentCard({ apt, now, isNext, open, onToggle, onDelay, onComplete, onEdit, onOpenCancel, actionLoading }:{
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

  return (
    <div className={`bg-bg-card rounded-xl overflow-hidden border transition-shadow
      ${isNext ? 'border-gold/40 shadow-[0_0_0_1px_rgba(212,168,83,0.2)]' : 'border-border'}`}>
      <button onClick={onToggle} className={`w-full flex items-stretch gap-3 text-left px-3.5 py-3.5 ${past ? 'opacity-60' : ''}`}>
        <div className="flex flex-col items-start gap-0.5 px-0.5">
          <div className={`font-display font-semibold text-[22px] leading-none tabular-nums
            ${isNext ? 'text-gold' : delayed ? 'text-orange-400' : 'text-cream'}`}>
            {apt.start_time.slice(0,5)}
          </div>
          <div className="text-[9px] text-muted tracking-wider font-medium">{apt.services?.duration_minutes} min</div>
        </div>
        <div className={`w-px self-stretch ${isNext ? 'bg-gold/35' : delayed ? 'bg-orange-500/30' : 'bg-border'}`}/>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm text-cream truncate ${cancelled ? 'line-through' : ''}`}>{apt.client_name}</div>
          <div className="flex items-center gap-2 mt-1 text-muted text-[11.5px]">
            <span>{apt.services?.name}</span>
            <span className="text-muted/60">·</span>
            <span className="font-display italic text-gold text-[12px]">
              {apt.services?.price ? `${Number(apt.services.price).toFixed(0)}€` : ''}
            </span>
          </div>
        </div>
        <StatusBadge apt={apt} isNext={isNext}/>
      </button>

      {/* Expanded: actions for confirmed */}
      {open && !cancelled && (
        <div className="border-t border-border/60 px-3.5 py-2.5 flex flex-wrap gap-1.5 items-center bg-white/[0.012]">
          <div className="flex items-center gap-1.5 w-full text-muted text-[11px] mb-1">
            <PhoneIcon className="w-4 h-4" /><span className="tabular-nums">{apt.client_phone}</span>
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

      {/* Expanded: delayed info */}
      {open && delayed && (
        <div className="border-t border-border/60 px-3.5 py-2.5 bg-orange-500/[0.05] flex items-center gap-2 text-[11.5px] text-orange-400">
          <ClockIcon className="w-3.5 h-3.5"/>
          Retraso de {apt.delay_minutes} min · {apt.delay_notified ? 'cliente avisado por WhatsApp' : 'sin avisar'}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ apt, isNext }: { apt: Appointment; isNext: boolean }) {
  let label = '—', cls = 'text-muted border-border'
  if (apt.status === 'completed') { label = '✓'; cls = 'text-green-400 bg-green-700/10 border-green-700/30' }
  else if (apt.status === 'delayed') { label = `+${apt.delay_minutes}'`; cls = 'text-orange-400 bg-orange-500/10 border-orange-500/30' }
  else if (apt.status === 'cancelled') { label = 'X'; cls = 'text-red-400 bg-red-900/10 border-red-900/30' }
  else if (isNext) { label = 'siguiente'; cls = 'text-gold bg-gold/15 border-gold/35' }
  return (
    <div className={`self-start px-2 py-1 rounded text-[9.5px] uppercase font-bold tracking-wider border ${cls}`}>{label}</div>
  )
}

function Chip({ kind, onClick, disabled, children }: {
  kind: 'ok'|'warn'|'bad'|'edit'; onClick:()=>void; disabled?:boolean; children:React.ReactNode
}) {
  const cls = {
    ok:   'text-green-400 bg-green-700/10 border-green-700/35',
    warn: 'text-orange-400 bg-orange-500/10 border-orange-500/35',
    bad:  'text-red-400 bg-red-900/10 border-red-900/35',
    edit: 'text-gold bg-gold/10 border-gold/35',
  }[kind]
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-2 py-1.5 rounded text-[11px] font-semibold border ${cls}`}>{children}</button>
  )
}

// ─────────────────────────────────────────────────────────────
// Timeline view
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
            <div className="w-11 pt-1 text-right text-muted font-display text-sm tabular-nums">
              {String(h).padStart(2,'0')}
            </div>
            <div className="flex-1 border-l border-border/50 pl-2.5 pb-1.5">
              {startsHere && apt ? (
                <div className={`rounded-lg px-3 py-2 border ${
                  apt.status === 'completed' ? 'bg-green-700/[0.06] border-green-700/30'
                  : apt.status === 'delayed' ? 'bg-orange-500/[0.06] border-orange-500/30'
                  : 'bg-gold/10 border-gold/35'}`}>
                  <div className="font-semibold text-[13px] text-cream">{apt.client_name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{apt.services?.name} · {apt.start_time.slice(0,5)}–{apt.end_time.slice(0,5)}</div>
                </div>
              ) : apt ? (
                <div className="h-[38px] border-l-2 border-gold/30 ml-1"/>
              ) : (
                <button onClick={() => onCreate(`${String(h).padStart(2,'0')}:00`)}
                  className="text-muted/60 text-[10.5px] italic font-display pt-1 hover:text-gold">
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
// Modal shell + form helpers
// ─────────────────────────────────────────────────────────────
function Modal({ onClose, title, subtitle, children }: { onClose:()=>void; title:string; subtitle?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div onClick={e => e.stopPropagation()}
        className="bg-bg-card border border-border border-b-0 sm:border-b sm:rounded-2xl rounded-t-2xl w-full sm:max-w-sm
                   px-5 pt-5 pb-10 max-h-[92vh] overflow-y-auto shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
        <div className="w-9 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden"/>
        <h2 className="font-display italic text-[22px] text-cream leading-tight">{title}</h2>
        {subtitle && <div className="text-[12px] text-muted mb-4 mt-0.5">{subtitle}</div>}
        {!subtitle && <div className="mb-4"/>}
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-muted mb-1.5">{label}</div>
      {children}
    </div>
  )
}

const INPUT = "w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-cream placeholder-muted text-sm focus:outline-none focus:border-gold"
const BTN_GHOST = "flex-1 py-3 rounded-lg border border-border text-muted text-sm font-medium"
const BTN_PRIMARY = "flex-1 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"

// ─────────────────────────────────────────────────────────────
// Inline SVG icons
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
function AlertIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>)
}
function PhoneIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)
}
function PlusIcon({ className='' }) {
  return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
}

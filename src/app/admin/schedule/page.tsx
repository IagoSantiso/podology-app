'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BrandHeader from '@/components/admin/BrandHeader'

interface AvailabilityRow { id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean; break_start?: string | null; break_end?: string | null }
interface Holiday { id?: string; holiday_date: string; name: string; is_national: boolean }
interface Vacation { id?: string; start_date: string; end_date: string; reason: string }

const DAY_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTH = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

// Spanish national holidays 2025-2026
const NATIONAL: Omit<Holiday,'id'>[] = [
  { holiday_date: '2025-01-01', name: 'Año Nuevo', is_national: true },
  { holiday_date: '2025-01-06', name: 'Día de Reyes', is_national: true },
  { holiday_date: '2025-04-18', name: 'Viernes Santo', is_national: true },
  { holiday_date: '2025-05-01', name: 'Día del Trabajador', is_national: true },
  { holiday_date: '2025-08-15', name: 'Asunción de la Virgen', is_national: true },
  { holiday_date: '2025-10-12', name: 'Día de la Hispanidad', is_national: true },
  { holiday_date: '2025-11-01', name: 'Todos los Santos', is_national: true },
  { holiday_date: '2025-12-06', name: 'Día de la Constitución', is_national: true },
  { holiday_date: '2025-12-08', name: 'Inmaculada Concepción', is_national: true },
  { holiday_date: '2025-12-25', name: 'Navidad', is_national: true },
  { holiday_date: '2026-01-01', name: 'Año Nuevo', is_national: true },
  { holiday_date: '2026-01-06', name: 'Día de Reyes', is_national: true },
  { holiday_date: '2026-04-03', name: 'Viernes Santo', is_national: true },
  { holiday_date: '2026-05-01', name: 'Día del Trabajador', is_national: true },
  { holiday_date: '2026-08-15', name: 'Asunción de la Virgen', is_national: true },
  { holiday_date: '2026-10-12', name: 'Día de la Hispanidad', is_national: true },
  { holiday_date: '2026-11-01', name: 'Todos los Santos', is_national: true },
  { holiday_date: '2026-12-06', name: 'Día de la Constitución', is_national: true },
  { holiday_date: '2026-12-08', name: 'Inmaculada Concepción', is_national: true },
  { holiday_date: '2026-12-25', name: 'Navidad', is_national: true },
]

const fmt = (t: string) => t?.slice(0,5) ?? ''

export default function SchedulePage() {
  const router = useRouter()
  const [tab, setTab] = useState<'week'|'vac'|'fest'>('week')
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newVac, setNewVac] = useState({ start_date: '', end_date: '', reason: '' })
  const [newHol, setNewHol] = useState({ holiday_date: '', name: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/availability').then(r => { if (r.status === 401) { router.push('/admin'); throw new Error() } return r.json() }),
      fetch('/api/admin/holidays').then(r => r.json()),
      // NEW endpoint — see _migration-vacations.sql. Safe-fail if not yet wired:
      fetch('/api/admin/vacations').then(r => r.ok ? r.json() : { vacations: [] }).catch(() => ({ vacations: [] })),
    ]).then(([av, hol, vac]) => {
      setAvailability(av.availability ?? [])
      setHolidays(hol.holidays ?? [])
      setVacations(vac.vacations ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [router])

  function updateRow(id: string, field: keyof AvailabilityRow, value: unknown) {
    setAvailability(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  async function saveAvailability() {
    setSaving(true)
    await fetch('/api/admin/availability', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: availability.map(r => ({ id: r.id, day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, is_active: r.is_active, break_start: r.break_start || null, break_end: r.break_end || null })) }),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-muted">Cargando...</p></main>

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto">
      <BrandHeader section="Horario" />

      {/* Title */}
      <div className="px-5 pt-[18px]">
        <h1 className="font-display italic text-[32px] leading-none text-cream">Horario</h1>
        <p className="font-display italic text-[14px] text-muted mt-1.5">Disponibilidad, vacaciones y festivos</p>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-5 border-b border-border/50">
        {[
          {k:'week' as const, l:'Semana'},
          {k:'vac'  as const, l:'Vacaciones'},
          {k:'fest' as const, l:'Festivos'},
        ].map(t => {
          const is = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`relative pt-2 pb-2.5 text-xs font-semibold uppercase tracking-[0.12em]
                ${is ? 'text-gold' : 'text-muted'}`}>
              {t.l}
              {is && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gold"/>}
            </button>
          )
        })}
      </div>

      {/* WEEK TAB */}
      {tab === 'week' && (
        <div className="px-5 pt-5">
          <Section title="Semana tipo" accent="se aplica cada semana"/>
          <div className="flex flex-col gap-2">
            {[1,2,3,4,5,6,0].map(d => {
              const row = availability.find(r => r.day_of_week === d)
              if (!row) return null
              const active = row.is_active
              const sm = slotToMin(fmt(row.start_time)), em = slotToMin(fmt(row.end_time))
              const hasBreak = !!(row.break_start && row.break_end)
              const breakMin = hasBreak
                ? Math.max(0, slotToMin(fmt(row.break_end!)) - slotToMin(fmt(row.break_start!)))
                : 0
              const effectiveMin = em - sm - breakMin
              const hours = active ? (effectiveMin % 60 === 0 ? String(effectiveMin / 60) : (effectiveMin / 60).toFixed(1)) : '0'
              return (
                <div key={row.id} className={`bg-bg-card rounded-xl px-3.5 py-3 border flex items-start gap-3 transition-opacity
                  ${active ? 'border-border opacity-100' : 'border-border/40 opacity-55'}`}>
                  <div className="pt-0.5">
                    <Toggle on={active} onChange={v => updateRow(row.id, 'is_active', v)}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-display font-semibold text-base leading-none ${active ? 'text-cream' : 'text-muted'}`}>
                      {DAY_LONG[d]}
                    </div>
                    {active ? (
                      <>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <input type="time" value={fmt(row.start_time)} onChange={e => updateRow(row.id, 'start_time', e.target.value + ':00')}
                            className="bg-bg-input border border-border rounded px-2 py-1 text-cream text-[12.5px] tabular-nums w-[88px] focus:outline-none focus:border-gold"/>
                          <span className="text-muted font-display italic text-[13px]">a</span>
                          <input type="time" value={fmt(row.end_time)} onChange={e => updateRow(row.id, 'end_time', e.target.value + ':00')}
                            className="bg-bg-input border border-border rounded px-2 py-1 text-cream text-[12.5px] tabular-nums w-[88px] focus:outline-none focus:border-gold"/>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-muted/70 font-semibold tracking-[0.12em] uppercase">Pausa</span>
                          <Toggle on={hasBreak} onChange={v => {
                            updateRow(row.id, 'break_start', v ? '14:00:00' : null)
                            updateRow(row.id, 'break_end',   v ? '16:00:00' : null)
                          }} size={14}/>
                          {hasBreak && (
                            <>
                              <input type="time" value={fmt(row.break_start!)} onChange={e => updateRow(row.id, 'break_start', e.target.value + ':00')}
                                className="bg-bg-input border border-border rounded px-2 py-1 text-cream text-[12.5px] tabular-nums w-[88px] focus:outline-none focus:border-gold"/>
                              <span className="text-muted font-display italic text-[13px]">a</span>
                              <input type="time" value={fmt(row.break_end!)} onChange={e => updateRow(row.id, 'break_end', e.target.value + ':00')}
                                className="bg-bg-input border border-border rounded px-2 py-1 text-cream text-[12.5px] tabular-nums w-[88px] focus:outline-none focus:border-gold"/>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-muted/60 italic font-display mt-1">cerrado</div>
                    )}
                  </div>
                  {active && (
                    <div className="text-right pt-0.5">
                      <span className="font-display font-semibold text-lg text-gold tabular-nums">{hours}</span>
                      <span className="text-[11px] text-muted ml-0.5">h</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={saveAvailability} disabled={saving}
            className="mt-3.5 w-full py-3.5 bg-gold text-bg rounded-lg font-semibold text-sm tracking-[0.03em] disabled:opacity-50">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar horario'}
          </button>

          {/* Total */}
          <div className="mt-6 px-3.5 py-3.5 bg-bg-card border border-border/50 rounded-xl">
            <div className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-muted mb-2.5">Total semanal</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-semibold text-4xl text-gold leading-none tabular-nums">
                {availability.filter(r => r.is_active).reduce((s,r) => {
                  const sm = slotToMin(fmt(r.start_time)), em = slotToMin(fmt(r.end_time))
                  const breakMin = (r.break_start && r.break_end)
                    ? Math.max(0, slotToMin(fmt(r.break_end)) - slotToMin(fmt(r.break_start)))
                    : 0
                  return s + (em - sm - breakMin)
                }, 0) / 60}
              </span>
              <span className="font-display italic text-base text-muted">horas</span>
              <span className="flex-1"/>
              <span className="text-[11px] text-muted">{availability.filter(r => r.is_active).length} días abiertos</span>
            </div>
          </div>
        </div>
      )}

      {/* VACATIONS TAB */}
      {tab === 'vac' && (
        <div className="px-5 pt-5">
          <Section title="Vacaciones" accent="cierra rangos completos"/>
          <div className="flex flex-col gap-2">
            {vacations.map(v => (
              <div key={v.id ?? v.start_date} className="bg-bg-card rounded-xl p-3.5 border border-border flex items-center gap-3">
                <span className="w-1 self-stretch rounded-sm bg-gold"/>
                <div className="flex-1 min-w-0">
                  <div className="font-display italic text-lg text-cream leading-tight">
                    {fmtRange(v.start_date, v.end_date)}
                  </div>
                  <div className="text-[11.5px] text-muted mt-1">
                    {v.reason || 'Sin motivo'} · <span className="text-gold">{dayCount(v.start_date, v.end_date)} días</span>
                  </div>
                </div>
                <button onClick={() => removeVac(v.id ?? v.start_date, setVacations)} className="text-muted p-1.5">
                  <Trash className="w-3.5 h-3.5"/>
                </button>
              </div>
            ))}
            {vacations.length === 0 && (
              <div className="py-5 text-center text-muted font-display italic border border-dashed border-border/50 rounded-xl">
                Sin vacaciones programadas
              </div>
            )}
          </div>

          <div className="mt-3.5 bg-bg-card border border-border/50 rounded-xl p-3.5">
            <div className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-muted mb-2.5">Añadir rango</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Desde"><input type="date" value={newVac.start_date} onChange={e => setNewVac(p => ({...p, start_date: e.target.value}))} className={SMALL_INPUT}/></Field>
              <Field label="Hasta"><input type="date" value={newVac.end_date}   onChange={e => setNewVac(p => ({...p, end_date:   e.target.value}))} className={SMALL_INPUT}/></Field>
            </div>
            <Field label="Motivo (opcional)">
              <input value={newVac.reason} onChange={e => setNewVac(p => ({...p, reason: e.target.value}))}
                placeholder="Navidades, formación, descanso..." className={SMALL_INPUT}/>
            </Field>
            <button onClick={async () => {
                if (!newVac.start_date || !newVac.end_date) return
                await fetch('/api/admin/vacations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVac) })
                setVacations(prev => [...prev, { ...newVac, id: newVac.start_date }])
                setNewVac({ start_date: '', end_date: '', reason: '' })
              }}
              className="mt-1 w-full py-2.5 bg-transparent border border-gold text-gold rounded-md font-semibold text-[12.5px] flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5"/> Añadir vacaciones
            </button>
          </div>
        </div>
      )}

      {/* FESTIVOS TAB */}
      {tab === 'fest' && (
        <div className="px-5 pt-5">
          <Section title="Nacionales" accent={`España, ${new Date().getFullYear()}`}/>
          <div className="flex flex-col gap-1">
            {NATIONAL.filter(h => {
              const y = parseInt(h.holiday_date.slice(0,4))
              return y === new Date().getFullYear() || y === new Date().getFullYear() + 1
            }).map(h => {
              const on = holidays.some(x => x.holiday_date === h.holiday_date)
              return (
                <div key={h.holiday_date} onClick={() => toggleHoliday(h, holidays, setHolidays)}
                  className="flex items-center gap-3.5 py-2.5 border-b border-border/50 cursor-pointer">
                  <span className={`font-display font-semibold text-sm w-14 tabular-nums ${on ? 'text-gold' : 'text-muted'}`}>
                    {fmtDate(h.holiday_date)}
                  </span>
                  <span className={`flex-1 text-[13px] ${on ? 'text-cream font-medium' : 'text-muted'}`}>{h.name}</span>
                  <Toggle on={on} onChange={() => toggleHoliday(h, holidays, setHolidays)} size={16}/>
                </div>
              )
            })}
          </div>

          <div className="h-6"/>

          <Section title="Locales" accent="añade los de tu municipio"/>
          {holidays.filter(h => !h.is_national).length > 0 && (
            <div className="flex flex-col gap-1.5 mb-3">
              {holidays.filter(h => !h.is_national).map(h => (
                <div key={h.holiday_date} className="bg-bg-card rounded-lg px-3.5 py-2.5 border border-border flex items-center gap-3">
                  <span className="font-display font-semibold text-sm text-gold w-14 tabular-nums">{fmtDate(h.holiday_date)}</span>
                  <span className="flex-1 text-[13px] text-cream">{h.name}</span>
                  <button onClick={async () => {
                    await fetch('/api/admin/holidays', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holiday_date: h.holiday_date }) })
                    setHolidays(prev => prev.filter(x => x.holiday_date !== h.holiday_date))
                  }} className="text-muted p-1">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-bg-card border border-border/50 rounded-xl p-3.5">
            <div className="grid grid-cols-[1fr_1.4fr] gap-2 mb-2.5">
              <Field label="Fecha"><input type="date" value={newHol.holiday_date} onChange={e => setNewHol(p => ({...p, holiday_date: e.target.value}))} className={SMALL_INPUT}/></Field>
              <Field label="Nombre"><input value={newHol.name} onChange={e => setNewHol(p => ({...p, name: e.target.value}))} placeholder="San Roque, Patrón…" className={SMALL_INPUT}/></Field>
            </div>
            <button onClick={async () => {
                if (!newHol.holiday_date || !newHol.name) return
                await fetch('/api/admin/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newHol, is_national: false }) })
                setHolidays(prev => [...prev, { ...newHol, is_national: false }])
                setNewHol({ holiday_date: '', name: '' })
              }}
              className="w-full py-2.5 bg-transparent border border-gold text-gold rounded-md font-semibold text-[12px] flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5"/> Añadir festivo local
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function slotToMin(t: string) { const [h,m] = t.split(':').map(Number); return h*60 + m }
function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getDate()} ${MONTH[dt.getMonth()].slice(0,3)}`
}
function fmtRange(s: string, e: string) {
  const a = new Date(s + 'T00:00:00'), b = new Date(e + 'T00:00:00')
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTH[a.getMonth()]}`
  return `${a.getDate()} ${MONTH[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTH[b.getMonth()].slice(0,3)}`
}
function dayCount(s: string, e: string) {
  return Math.round((new Date(e).valueOf() - new Date(s).valueOf())/(1000*60*60*24)) + 1
}
async function toggleHoliday(h: Omit<Holiday,'id'>, holidays: Holiday[], setHolidays: (fn:(p:Holiday[])=>Holiday[])=>void) {
  const on = holidays.some(x => x.holiday_date === h.holiday_date)
  if (on) {
    await fetch('/api/admin/holidays', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holiday_date: h.holiday_date }) })
    setHolidays(prev => prev.filter(x => x.holiday_date !== h.holiday_date))
  } else {
    await fetch('/api/admin/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(h) })
    setHolidays(prev => [...prev, { ...h, id: h.holiday_date }])
  }
}
async function removeVac(id: string, setVacations: (fn:(p:Vacation[])=>Vacation[])=>void) {
  await fetch('/api/admin/vacations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  setVacations(prev => prev.filter(v => (v.id ?? v.start_date) !== id))
}

// ─────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────
function Section({ title, accent }: { title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gold">{title}</span>
      {accent && <span className="font-display italic text-[13px] text-muted">{accent}</span>}
      <span className="flex-1 h-px bg-border/50"/>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-muted mb-1">{label}</div>
      {children}
    </div>
  )
}

function Toggle({ on, onChange, size = 20 }: { on: boolean; onChange: (v:boolean)=>void; size?: number }) {
  const W = size * 1.85, H = size + 4
  return (
    <button onClick={() => onChange(!on)} style={{ width: W, height: H }}
      className={`relative rounded-full shrink-0 transition-colors ${on ? 'bg-gold' : 'bg-border'}`}>
      <span className="absolute top-0.5 rounded-full transition-[left] shadow-sm"
        style={{ left: on ? W - size - 2 : 2, width: size, height: size, background: on ? '#0a0a0a' : '#f5f0e8' }}/>
    </button>
  )
}

const SMALL_INPUT = "w-full bg-bg-input border border-border rounded px-2.5 py-2 text-cream text-[12.5px] focus:outline-none focus:border-gold"

function Trash({ className='' }) { return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>) }
function Plus({ className='' }) { return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>) }

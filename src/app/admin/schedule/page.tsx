'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AvailabilityRow {
  id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean
}

interface Holiday {
  id?: string; holiday_date: string; name: string; is_national: boolean
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Spanish national holidays 2025-2026 (Viernes Santo is variable)
const NATIONAL_HOLIDAYS: Omit<Holiday, 'id'>[] = [
  // 2025
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
  // 2026
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

function fmt(t: string) { return t?.slice(0, 5) ?? '' }

export default function SchedulePage() {
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [localForm, setLocalForm] = useState({ holiday_date: '', name: '' })
  const [localSaving, setLocalSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/availability').then(r => { if (r.status === 401) { router.push('/admin'); throw new Error() } return r.json() }),
      fetch('/api/admin/holidays').then(r => r.json()),
    ]).then(([avData, holData]) => {
      setAvailability(avData.availability ?? [])
      setDbHolidays(holData.holidays ?? [])
      setLoading(false)
    }).catch(() => {})
  }, [router])

  function updateRow(id: string, field: keyof AvailabilityRow, value: unknown) {
    setAvailability(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  async function saveAvailability() {
    setSaving(true)
    await fetch('/api/admin/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: availability.map(r => ({ id: r.id, day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, is_active: r.is_active })) }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function isHolidayEnabled(date: string) {
    return dbHolidays.some(h => h.holiday_date === date)
  }

  async function toggleNational(h: Omit<Holiday, 'id'>) {
    if (isHolidayEnabled(h.holiday_date)) {
      await fetch('/api/admin/holidays', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holiday_date: h.holiday_date }) })
      setDbHolidays(prev => prev.filter(d => d.holiday_date !== h.holiday_date))
    } else {
      await fetch('/api/admin/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(h) })
      setDbHolidays(prev => [...prev, { ...h, id: h.holiday_date }])
    }
  }

  async function addLocal() {
    if (!localForm.holiday_date || !localForm.name) return
    setLocalSaving(true)
    await fetch('/api/admin/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...localForm, is_national: false }) })
    setDbHolidays(prev => [...prev.filter(h => h.holiday_date !== localForm.holiday_date), { ...localForm, is_national: false }])
    setLocalForm({ holiday_date: '', name: '' })
    setLocalSaving(false)
  }

  async function removeLocal(date: string) {
    await fetch('/api/admin/holidays', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holiday_date: date }) })
    setDbHolidays(prev => prev.filter(h => h.holiday_date !== date))
  }

  const localHolidays = dbHolidays.filter(h => !h.is_national)
  const currentYear = new Date().getFullYear()
  const visibleNationals = NATIONAL_HOLIDAYS.filter(h => {
    const y = parseInt(h.holiday_date.slice(0, 4))
    return y === currentYear || y === currentYear + 1
  })

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-muted">Cargando...</p></main>

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gold mb-8">Horario</h1>

      {/* ── Disponibilidad semanal ── */}
      <section className="mb-8">
        <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Horario semanal</h2>
        <div className="flex flex-col gap-2">
          {availability.map(row => (
            <div key={row.id} className="bg-bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => updateRow(row.id, 'is_active', !row.is_active)}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${row.is_active ? 'bg-gold' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${row.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className={`font-medium w-24 ${row.is_active ? 'text-cream' : 'text-muted'}`}>
                  {DAY_NAMES[row.day_of_week]}
                </span>
              </div>
              {row.is_active && (
                <div className="flex items-center gap-2 text-sm">
                  <input type="time" value={fmt(row.start_time)} onChange={e => updateRow(row.id, 'start_time', e.target.value)}
                    className="bg-bg-input border border-border rounded-lg px-3 py-2 text-cream focus:outline-none focus:border-gold w-28" />
                  <span className="text-muted">—</span>
                  <input type="time" value={fmt(row.end_time)} onChange={e => updateRow(row.id, 'end_time', e.target.value)}
                    className="bg-bg-input border border-border rounded-lg px-3 py-2 text-cream focus:outline-none focus:border-gold w-28" />
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={saveAvailability} disabled={saving}
          className="mt-4 w-full bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-50">
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar horario'}
        </button>
      </section>

      {/* ── Festivos nacionales ── */}
      <section className="mb-8">
        <h2 className="text-xs text-muted uppercase tracking-widest mb-1">Festivos nacionales (España)</h2>
        <p className="text-xs text-muted mb-4">Activa los que apliquen en tu municipio para bloquearlos automáticamente</p>
        <div className="flex flex-col gap-2">
          {visibleNationals.map(h => {
            const enabled = isHolidayEnabled(h.holiday_date)
            return (
              <div key={h.holiday_date} className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3">
                <div>
                  <p className="text-cream text-sm font-medium">{h.name}</p>
                  <p className="text-muted text-xs">{h.holiday_date}</p>
                </div>
                <button
                  onClick={() => toggleNational(h)}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-gold' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Festivos locales ── */}
      <section>
        <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Festivos locales personalizados</h2>
        <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-3 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">Fecha</label>
              <input type="date" value={localForm.holiday_date} onChange={e => setLocalForm(p => ({ ...p, holiday_date: e.target.value }))}
                className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream focus:outline-none focus:border-gold text-sm" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Nombre</label>
              <input type="text" value={localForm.name} onChange={e => setLocalForm(p => ({ ...p, name: e.target.value }))}
                placeholder="San Roque..." className="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream placeholder-muted focus:outline-none focus:border-gold text-sm" />
            </div>
          </div>
          <button onClick={addLocal} disabled={localSaving || !localForm.holiday_date || !localForm.name}
            className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
            {localSaving ? 'Añadiendo...' : '+ Añadir festivo local'}
          </button>
        </div>

        {localHolidays.length > 0 && (
          <div className="flex flex-col gap-2">
            {localHolidays.map(h => (
              <div key={h.holiday_date} className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3">
                <div>
                  <p className="text-cream text-sm">{h.name}</p>
                  <p className="text-muted text-xs">{h.holiday_date}</p>
                </div>
                <button onClick={() => removeLocal(h.holiday_date)} className="text-muted hover:text-red-400 text-sm transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import BrandHeader from '@/components/admin/BrandHeader'

interface VisitRecord {
  clinical_notes: string | null
  treatment_name: string | null
  treatment_instructions: string | null
  podologist_notes: string | null
}
interface Appointment {
  id: string; client_name: string; client_email: string; client_phone: string
  is_guest: boolean; appointment_date: string; start_time: string
  status: string; services: { name: string; price: number | null } | null
  visit_history: VisitRecord[]
}
interface Client {
  email: string; name: string; phone: string; is_guest: boolean; appointments: Appointment[]
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  completed: { label: 'Completada', bg: 'var(--ok)',      color: '#fff',           border: 'var(--ok)' },
  confirmed: { label: 'Confirmada', bg: 'var(--card)',    color: 'var(--ok)',      border: 'var(--ok)' },
  delayed:   { label: 'Retrasada',  bg: 'var(--warn)',    color: '#fff',           border: 'var(--warn)' },
  cancelled: { label: 'Cancelada',  bg: 'var(--danger)',  color: '#fff',           border: 'var(--danger)' },
}

export default function ClientsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => { if (r.status === 401) { router.push('/admin'); throw new Error() } return r.json() })
      .then(d => { setAppointments(d.appointments ?? []); setLoading(false) })
      .catch(() => {})
  }, [router])

  const clients = useMemo<Client[]>(() => {
    const map = new Map<string, Client>()
    for (const apt of appointments) {
      if (!map.has(apt.client_email)) {
        map.set(apt.client_email, {
          email: apt.client_email, name: apt.client_name,
          phone: apt.client_phone, is_guest: apt.is_guest, appointments: [],
        })
      }
      map.get(apt.client_email)!.appointments.push(apt)
    }
    return Array.from(map.values())
  }, [appointments])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto" style={{ background: 'var(--bg)' }}>
      <BrandHeader section="Clientes" />

      <div className="px-5 pt-5 pb-4">
        <h1 className="font-display italic text-[28px] leading-none mb-4" style={{ color: 'var(--ink)' }}>Clientes</h1>

        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, email o teléfono..."
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <div className="px-5">
        {loading ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--ink-3)' }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--ink-3)' }}>Sin resultados</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(client => {
              const isOpen = expanded === client.email
              const completedCount = client.appointments.filter(a => a.status === 'completed').length
              const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={client.email} className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>

                  {/* Client header row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : client.email)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{client.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>{client.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs" style={{ color: 'var(--ink-3)' }}>{client.appointments.length} citas</span>
                        {completedCount > 0 && (
                          <p className="text-xs font-semibold" style={{ color: 'var(--ok)' }}>{completedCount} completadas</p>
                        )}
                      </div>
                      {!client.is_guest && (
                        <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                          Cuenta
                        </span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--ink-3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {/* Appointment list */}
                  {isOpen && (
                    <div className="px-4 pb-3 pt-0" style={{ borderTop: '1px solid var(--line-2)' }}>
                      <p className="text-xs py-2.5" style={{ color: 'var(--ink-3)' }}>{client.email}</p>
                      <div className="flex flex-col gap-0.5">
                        {client.appointments.map(apt => {
                          const vh = apt.visit_history?.[0] ?? null
                          const hasNotes = !!(vh?.clinical_notes || vh?.treatment_name || vh?.podologist_notes)
                          const cfg = STATUS_CFG[apt.status] ?? STATUS_CFG.confirmed
                          return (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedApt(apt)}
                              className="w-full text-left flex items-center gap-2.5 py-2.5 transition-opacity hover:opacity-70"
                              style={{ borderBottom: '1px solid var(--line-2)' }}
                            >
                              {/* Date + service */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>
                                  {format(new Date(apt.appointment_date + 'T00:00:00'), "d MMM yyyy", { locale: es })}
                                  <span style={{ color: 'var(--ink-3)' }}> · {apt.start_time.slice(0, 5)}h</span>
                                </p>
                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-3)' }}>{apt.services?.name ?? '—'}</p>
                              </div>

                              {/* Price */}
                              {apt.services?.price != null && (
                                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--ink-2)' }}>
                                  {Number(apt.services.price).toFixed(0)} €
                                </span>
                              )}

                              {/* Notes indicator */}
                              {hasNotes && (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  className="shrink-0" style={{ color: 'var(--accent)' }}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                              )}

                              {/* Status chip */}
                              <span className="shrink-0 text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                {cfg.label}
                              </span>

                              {/* Chevron */}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className="shrink-0" style={{ color: 'var(--ink-3)' }}>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Visit detail modal */}
      {selectedApt && (
        <VisitModal apt={selectedApt} onClose={() => setSelectedApt(null)} />
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Visit detail modal
// ─────────────────────────────────────────────────────────────
function VisitModal({ apt, onClose }: { apt: Appointment; onClose: () => void }) {
  const vh = apt.visit_history?.[0] ?? null
  const cfg = STATUS_CFG[apt.status] ?? STATUS_CFG.confirmed
  const hasAnyClinical = !!(vh?.clinical_notes || vh?.treatment_name || vh?.podologist_notes)

  return (
    <div onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(28,40,38,0.5)', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-sm px-5 pt-5 pb-10 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', boxShadow: 'var(--shadow-lg)' }}>

        {/* Handle */}
        <div className="w-9 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: 'var(--line)' }}/>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-display italic text-[20px] leading-tight" style={{ color: 'var(--ink)' }}>
              {apt.services?.name ?? 'Visita'}
            </h2>
            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--ink-3)' }}>
              {format(new Date(apt.appointment_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })} · {apt.start_time.slice(0, 5)}h
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold tracking-wide px-2.5 py-1.5 rounded-xl mt-0.5"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>

        {/* Client name + price */}
        <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--line-2)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{apt.client_name}</p>
          {apt.services?.price != null && (
            <span className="font-display italic text-lg" style={{ color: 'var(--primary)' }}>
              {Number(apt.services.price).toFixed(2)} €
            </span>
          )}
        </div>

        {/* Clinical content */}
        {hasAnyClinical ? (
          <div className="flex flex-col gap-3">
            {vh?.clinical_notes && (
              <div>
                <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase mb-1.5" style={{ color: 'var(--ink-3)' }}>
                  Notas clínicas
                </p>
                <div className="rounded-xl px-3 py-2.5 text-sm leading-relaxed"
                  style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
                  {vh.clinical_notes}
                </div>
              </div>
            )}

            {vh?.treatment_name && (
              <div>
                <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase mb-1.5" style={{ color: 'var(--primary)' }}>
                  Tratamiento prescrito
                </p>
                <div className="rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{vh.treatment_name}</p>
                  {vh.treatment_instructions && (
                    <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--ink-2)' }}>{vh.treatment_instructions}</p>
                  )}
                </div>
              </div>
            )}

            {vh?.podologist_notes && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'var(--ink-3)' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--ink-3)' }}>
                    Notas internas
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2.5 text-sm leading-relaxed"
                  style={{ background: 'var(--field)', border: '1px dashed var(--line)', color: 'var(--ink-2)' }}>
                  {vh.podologist_notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-center py-4 font-display italic" style={{ color: 'var(--ink-3)' }}>
            Sin notas registradas
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
          style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

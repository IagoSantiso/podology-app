'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import BrandHeader from '@/components/admin/BrandHeader'

interface Appointment {
  id: string; client_name: string; client_email: string; client_phone: string
  is_guest: boolean; appointment_date: string; start_time: string
  status: string; services: { name: string; price: number | null } | null
}
interface Client {
  email: string; name: string; phone: string; is_guest: boolean; appointments: Appointment[]
}

const STATUS_LABEL: Record<string, string> = { completed: 'Completada', cancelled: 'Cancelada', confirmed: 'Confirmada', delayed: 'Retrasada' }

export default function ClientsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

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

        {/* Buscador */}
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
                <div
                  key={client.email}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : client.email)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
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
                        <span
                          className="text-xs rounded-full px-2 py-0.5 font-semibold"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                        >
                          Cuenta
                        </span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--ink-3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid var(--line-2)' }}>
                      {/* Email del cliente */}
                      <p className="text-xs py-2.5 mb-1" style={{ color: 'var(--ink-3)' }}>{client.email}</p>
                      <div className="flex flex-col gap-1.5">
                        {client.appointments.map(apt => {
                          const statusColor = apt.status === 'completed'
                            ? 'var(--ok)' : apt.status === 'cancelled'
                            ? 'var(--ink-3)' : 'var(--primary)'
                          return (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between py-2.5"
                              style={{ borderBottom: '1px solid var(--line-2)' }}
                            >
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                                  {format(new Date(apt.appointment_date + 'T00:00:00'), "d MMM yyyy", { locale: es })} · {apt.start_time.slice(0, 5)}h
                                </p>
                                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{apt.services?.name ?? '—'}</p>
                              </div>
                              <div className="text-right">
                                {apt.services?.price != null && (
                                  <p className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>{Number(apt.services.price).toFixed(2)} €</p>
                                )}
                                <span className="text-xs font-semibold" style={{ color: statusColor }}>
                                  {STATUS_LABEL[apt.status] ?? apt.status}
                                </span>
                              </div>
                            </div>
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
    </main>
  )
}

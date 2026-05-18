'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  is_guest: boolean
  appointment_date: string
  start_time: string
  status: string
  services: { name: string; price: number | null } | null
}

interface Client {
  email: string
  name: string
  phone: string
  is_guest: boolean
  appointments: Appointment[]
}

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
          email: apt.client_email,
          name: apt.client_name,
          phone: apt.client_phone,
          is_guest: apt.is_guest,
          appointments: [],
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
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard" className="text-muted hover:text-gold text-sm transition-colors">← Dashboard</Link>
        <h1 className="font-display text-2xl font-bold text-gold">Clientes</h1>
      </div>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre, email o teléfono..."
        className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold mb-4"
      />

      {loading ? (
        <p className="text-muted text-center py-12">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-center py-12">Sin resultados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(client => {
            const isOpen = expanded === client.email
            const confirmedCount = client.appointments.filter(a => a.status === 'completed').length
            return (
              <div key={client.email} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : client.email)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-cream font-semibold">{client.name}</p>
                    <p className="text-muted text-sm">{client.email} · {client.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-muted">{client.appointments.length} citas</span>
                      {confirmedCount > 0 && (
                        <p className="text-xs text-green-400">{confirmedCount} completadas</p>
                      )}
                    </div>
                    {!client.is_guest && (
                      <span className="text-xs border border-gold/40 text-gold rounded-full px-2 py-0.5">Cuenta</span>
                    )}
                    <span className="text-muted">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="flex flex-col gap-2">
                      {client.appointments.map(apt => (
                        <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <p className="text-cream text-sm">
                              {format(new Date(apt.appointment_date + 'T00:00:00'), "d MMM yyyy", { locale: es })} · {apt.start_time.slice(0, 5)}h
                            </p>
                            <p className="text-muted text-xs">{apt.services?.name ?? '—'}</p>
                          </div>
                          <div className="text-right">
                            {apt.services?.price && (
                              <p className="text-xs text-muted">{Number(apt.services.price).toFixed(2)} €</p>
                            )}
                            <span className={`text-xs ${apt.status === 'completed' ? 'text-green-400' : apt.status === 'cancelled' ? 'text-muted' : 'text-gold'}`}>
                              {apt.status === 'completed' ? 'Completada' : apt.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

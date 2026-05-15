'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number | null
  is_active: boolean
}

type Bono = {
  id: string
  name: string
  service_id: string | null
  total_sessions: number
  price: number | null
  is_active: boolean
  services?: { name: string } | null
}

type ClientBono = {
  id: string
  bono_id: string
  client_name: string
  client_email: string
  client_phone: string | null
  total_sessions: number
  remaining_sessions: number
  is_active: boolean
  purchased_at: string
  notes: string | null
  bonos?: { name: string; total_sessions: number; services?: { name: string } | null } | null
}

type Tab = 'servicios' | 'bonos' | 'clientes'

export default function ComercialPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('servicios')

  const [services, setServices] = useState<Service[]>([])
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [showNewService, setShowNewService] = useState(false)
  const [newServiceForm, setNewServiceForm] = useState({ name: '', price: '', duration_minutes: '30' })

  const [bonos, setBonos] = useState<Bono[]>([])
  const [showNewBono, setShowNewBono] = useState(false)
  const [newBonoForm, setNewBonoForm] = useState({ name: '', service_id: '', total_sessions: '10', price: '' })

  const [clientBonos, setClientBonos] = useState<ClientBono[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ bono_id: '', client_name: '', client_email: '', client_phone: '', notes: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [sr, br, cr] = await Promise.all([
      fetch('/api/admin/services'),
      fetch('/api/admin/bonos'),
      fetch('/api/admin/client-bonos'),
    ])
    if (sr.status === 401 || br.status === 401) { router.push('/admin'); return }
    if (sr.ok) { const d = await sr.json(); setServices(d.services ?? []) }
    if (br.ok) { const d = await br.json(); setBonos(d.bonos ?? []) }
    if (cr.ok) { const d = await cr.json(); setClientBonos(d.clientBonos ?? []) }
  }

  // ── Services ──────────────────────────────────────────────────────────────

  async function toggleService(id: string, is_active: boolean) {
    await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active }),
    })
    setServices(s => s.map(sv => sv.id === id ? { ...sv, is_active } : sv))
  }

  async function saveService() {
    if (!editingService?.name || !editingService?.duration_minutes) return
    setSaving(true)
    const r = await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingService),
    })
    if (r.ok) {
      const d = await r.json()
      setServices(s => s.map(sv => sv.id === d.service.id ? d.service : sv))
      setEditingService(null)
    }
    setSaving(false)
  }

  async function createService() {
    if (!newServiceForm.name || !newServiceForm.duration_minutes) return
    setSaving(true)
    const r = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newServiceForm.name,
        price: newServiceForm.price ? parseFloat(newServiceForm.price) : null,
        duration_minutes: parseInt(newServiceForm.duration_minutes),
      }),
    })
    if (r.ok) {
      const d = await r.json()
      setServices(s => [...s, d.service])
      setShowNewService(false)
      setNewServiceForm({ name: '', price: '', duration_minutes: '30' })
    }
    setSaving(false)
  }

  // ── Bonos ─────────────────────────────────────────────────────────────────

  async function toggleBono(id: string, is_active: boolean) {
    await fetch('/api/admin/bonos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active }),
    })
    setBonos(b => b.map(bn => bn.id === id ? { ...bn, is_active } : bn))
  }

  async function createBono() {
    if (!newBonoForm.name || !newBonoForm.total_sessions) return
    setSaving(true)
    const r = await fetch('/api/admin/bonos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newBonoForm.name,
        service_id: newBonoForm.service_id || null,
        total_sessions: parseInt(newBonoForm.total_sessions),
        price: newBonoForm.price ? parseFloat(newBonoForm.price) : null,
      }),
    })
    if (r.ok) {
      await loadAll()
      setShowNewBono(false)
      setNewBonoForm({ name: '', service_id: '', total_sessions: '10', price: '' })
    }
    setSaving(false)
  }

  // ── Client bonos ──────────────────────────────────────────────────────────

  async function useBono(id: string) {
    const r = await fetch('/api/admin/client-bonos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'use' }),
    })
    if (r.ok) {
      const d = await r.json()
      setClientBonos(cb => cb.map(b => b.id === id ? { ...b, ...d.clientBono } : b))
    }
  }

  async function assignBono() {
    if (!assignForm.bono_id || !assignForm.client_name || !assignForm.client_email) return
    setSaving(true)
    const r = await fetch('/api/admin/client-bonos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignForm),
    })
    if (r.ok) {
      await loadAll()
      setShowAssign(false)
      setAssignForm({ bono_id: '', client_name: '', client_email: '', client_phone: '', notes: '' })
    }
    setSaving(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const inputCls = 'w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-cream text-sm placeholder-muted focus:outline-none focus:border-gold'

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gold mb-6">Comercial</h1>

      {/* Inner tabs */}
      <div className="flex bg-bg-card border border-border rounded-xl p-1 mb-6 gap-1">
        {(['servicios', 'bonos', 'clientes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-gold text-bg' : 'text-muted hover:text-cream'
            }`}
          >
            {t === 'clientes' ? 'Bonos clientes' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      {tab === 'servicios' && (
        <div className="flex flex-col gap-4">
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            {services.map((sv, i) => (
              <div key={sv.id}>
                {i > 0 && <div className="border-t border-border" />}
                {editingService?.id === sv.id ? (
                  <div className="p-4 flex flex-col gap-3">
                    <input
                      value={editingService.name ?? ''}
                      onChange={e => setEditingService(p => ({ ...p, name: e.target.value }))}
                      className={inputCls}
                      placeholder="Nombre"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editingService.price ?? ''}
                        onChange={e => setEditingService(p => ({ ...p, price: e.target.value ? parseFloat(e.target.value) : null }))}
                        className={inputCls}
                        placeholder="Precio (€)"
                      />
                      <input
                        type="number"
                        value={editingService.duration_minutes ?? ''}
                        onChange={e => setEditingService(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                        className={inputCls}
                        placeholder="Duración (min)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveService} disabled={saving}
                        className="flex-1 bg-gold text-bg text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50 transition-opacity">
                        Guardar
                      </button>
                      <button onClick={() => setEditingService(null)}
                        className="flex-1 border border-border text-muted text-sm rounded-lg py-2.5 hover:text-cream transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${sv.is_active ? 'text-cream' : 'text-muted line-through'}`}>
                        {sv.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {sv.duration_minutes} min{sv.price != null ? ` · ${sv.price}€` : ''}
                      </p>
                    </div>
                    <button onClick={() => setEditingService(sv)}
                      className="text-xs text-muted hover:text-gold transition-colors px-2 py-1 shrink-0">
                      Editar
                    </button>
                    <button
                      onClick={() => toggleService(sv.id, !sv.is_active)}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${sv.is_active ? 'bg-gold' : 'bg-border'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-bg rounded-full transition-transform ${sv.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-center text-muted text-sm py-8">No hay servicios</p>
            )}
          </div>

          {showNewService ? (
            <div className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-cream">Nuevo servicio</p>
              <input
                value={newServiceForm.name}
                onChange={e => setNewServiceForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls}
                placeholder="Nombre (ej. Corte de pelo)"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newServiceForm.price}
                  onChange={e => setNewServiceForm(p => ({ ...p, price: e.target.value }))}
                  className={inputCls}
                  placeholder="Precio (€)"
                />
                <input
                  type="number"
                  value={newServiceForm.duration_minutes}
                  onChange={e => setNewServiceForm(p => ({ ...p, duration_minutes: e.target.value }))}
                  className={inputCls}
                  placeholder="Duración (min)"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={createService} disabled={saving}
                  className="flex-1 bg-gold text-bg text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
                  Crear servicio
                </button>
                <button onClick={() => setShowNewService(false)}
                  className="flex-1 border border-border text-muted text-sm rounded-lg py-2.5 hover:text-cream">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewService(true)}
              className="w-full border border-dashed border-border text-muted text-sm rounded-2xl py-4 hover:border-gold/50 hover:text-cream transition-colors">
              + Añadir servicio
            </button>
          )}
        </div>
      )}

      {/* ── BONOS ─────────────────────────────────────────────────────────── */}
      {tab === 'bonos' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted leading-relaxed">
            Los bonos activos se descuentan automáticamente cuando el cliente reserva cita con su email registrado.
          </p>

          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            {bonos.map((bn, i) => (
              <div key={bn.id}>
                {i > 0 && <div className="border-t border-border" />}
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${bn.is_active ? 'text-cream' : 'text-muted line-through'}`}>
                      {bn.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {bn.total_sessions} sesiones
                      {bn.price != null ? ` · ${bn.price}€` : ''}
                      {' · '}{bn.services?.name ?? 'Todos los servicios'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBono(bn.id, !bn.is_active)}
                    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${bn.is_active ? 'bg-gold' : 'bg-border'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-bg rounded-full transition-transform ${bn.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ))}
            {bonos.length === 0 && (
              <p className="text-center text-muted text-sm py-8">No hay bonos configurados</p>
            )}
          </div>

          {showNewBono ? (
            <div className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-cream">Nuevo bono</p>
              <input
                value={newBonoForm.name}
                onChange={e => setNewBonoForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls}
                placeholder="Nombre (ej. Bono Corte 10 sesiones)"
              />
              <select
                value={newBonoForm.service_id}
                onChange={e => setNewBonoForm(p => ({ ...p, service_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Válido para todos los servicios</option>
                {services.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newBonoForm.total_sessions}
                  onChange={e => setNewBonoForm(p => ({ ...p, total_sessions: e.target.value }))}
                  className={inputCls}
                  placeholder="Nº sesiones"
                />
                <input
                  type="number"
                  value={newBonoForm.price}
                  onChange={e => setNewBonoForm(p => ({ ...p, price: e.target.value }))}
                  className={inputCls}
                  placeholder="Precio total (€)"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={createBono} disabled={saving}
                  className="flex-1 bg-gold text-bg text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
                  Crear bono
                </button>
                <button onClick={() => setShowNewBono(false)}
                  className="flex-1 border border-border text-muted text-sm rounded-lg py-2.5 hover:text-cream">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewBono(true)}
              className="w-full border border-dashed border-border text-muted text-sm rounded-2xl py-4 hover:border-gold/50 hover:text-cream transition-colors">
              + Añadir bono
            </button>
          )}
        </div>
      )}

      {/* ── BONOS DE CLIENTES ─────────────────────────────────────────────── */}
      {tab === 'clientes' && (
        <div className="flex flex-col gap-4">
          {clientBonos.map(cb => {
            const pct = cb.total_sessions > 0 ? (cb.remaining_sessions / cb.total_sessions) * 100 : 0
            return (
              <div
                key={cb.id}
                className={`bg-bg-card border rounded-2xl p-4 ${cb.is_active ? 'border-border' : 'border-border/40 opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-cream truncate">{cb.client_name}</p>
                    <p className="text-xs text-muted truncate">{cb.client_email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gold">{cb.remaining_sessions}<span className="text-xs font-normal text-muted">/{cb.total_sessions}</span></p>
                    <p className="text-xs text-muted">sesiones</p>
                  </div>
                </div>
                <p className="text-xs text-muted mb-3">{cb.bonos?.name ?? 'Bono'}</p>
                <div className="h-1.5 bg-border rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {cb.is_active && cb.remaining_sessions > 0 ? (
                  <button
                    onClick={() => useBono(cb.id)}
                    className="w-full border border-gold/40 text-gold text-xs font-semibold rounded-lg py-2 hover:bg-gold/10 transition-colors"
                  >
                    Usar sesión manualmente
                  </button>
                ) : (
                  <p className="text-center text-xs text-muted">Bono agotado</p>
                )}
              </div>
            )
          })}

          {clientBonos.length === 0 && (
            <p className="text-center text-muted text-sm py-8">No hay bonos asignados a clientes</p>
          )}

          {showAssign ? (
            <div className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-cream">Asignar bono a cliente</p>
              <select
                value={assignForm.bono_id}
                onChange={e => setAssignForm(p => ({ ...p, bono_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Seleccionar bono...</option>
                {bonos.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.total_sessions} sesiones)</option>
                ))}
              </select>
              <input
                value={assignForm.client_name}
                onChange={e => setAssignForm(p => ({ ...p, client_name: e.target.value }))}
                className={inputCls}
                placeholder="Nombre del cliente"
              />
              <input
                type="email"
                value={assignForm.client_email}
                onChange={e => setAssignForm(p => ({ ...p, client_email: e.target.value }))}
                className={inputCls}
                placeholder="Email del cliente"
              />
              <input
                type="tel"
                value={assignForm.client_phone}
                onChange={e => setAssignForm(p => ({ ...p, client_phone: e.target.value }))}
                className={inputCls}
                placeholder="Teléfono (opcional)"
              />
              <textarea
                value={assignForm.notes}
                onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))}
                className={`${inputCls} resize-none`}
                placeholder="Notas (opcional)"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={assignBono} disabled={saving}
                  className="flex-1 bg-gold text-bg text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
                  Asignar bono
                </button>
                <button onClick={() => setShowAssign(false)}
                  className="flex-1 border border-border text-muted text-sm rounded-lg py-2.5 hover:text-cream">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAssign(true)}
              className="w-full border border-dashed border-border text-muted text-sm rounded-2xl py-4 hover:border-gold/50 hover:text-cream transition-colors">
              + Asignar bono a cliente
            </button>
          )}
        </div>
      )}
    </main>
  )
}

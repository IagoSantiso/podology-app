'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BrandHeader from '@/components/admin/BrandHeader'

type Service = {
  id: string
  name: string
  description: string | null
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

type BonoRequest = {
  id: string
  bono_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  is_gift: boolean
  recipient_name: string | null
  recipient_email: string | null
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  bonos?: { name: string; total_sessions: number; price: number | null; services?: { name: string } | null } | null
}

type BillingData = {
  totalCitas: number
  totalBonos: number
  totalFacturado: number
  numCitas: number
  numBonos: number
  porServicio: { name: string; count: number; revenue: number }[]
  lineItems: { fecha: string; concepto: string; tipo: 'consulta' | 'bono'; importe: number }[]
}

type Tab         = 'servicios' | 'bonos' | 'ventas' | 'informes'
type VentasSubTab = 'activos' | 'solicitudes'

const INPUT       = 'w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors'
const BTN_PRIMARY = 'flex-1 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-opacity hover:opacity-90'
const BTN_GHOST   = 'flex-1 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-70'

const TAB_LABELS: Record<Tab, string> = {
  servicios: 'Servicios',
  bonos:     'Bonos',
  ventas:    'Ventas',
  informes:  'Informes',
}

function getQuarterRange(year: number, q: number): { from: string; to: string } {
  const ranges = [
    { from: `${year}-01-01`, to: `${year}-03-31` },
    { from: `${year}-04-01`, to: `${year}-06-30` },
    { from: `${year}-07-01`, to: `${year}-09-30` },
    { from: `${year}-10-01`, to: `${year}-12-31` },
  ]
  return ranges[q - 1]
}

function exportCSV(
  lineItems: BillingData['lineItems'],
  q: number,
  year: number,
) {
  const rows = [
    ['Fecha', 'Concepto', 'Tipo', 'Importe (EUR)'],
    ...lineItems.map(l => [
      l.fecha,
      l.concepto,
      l.tipo === 'consulta' ? 'Consulta' : 'Bono',
      l.importe.toFixed(2).replace('.', ','),
    ]),
  ]
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `facturacion_T${q}_${year}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ComercialPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('servicios')

  // ── Servicios ──────────────────────────────────────────────────────
  const [services, setServices]           = useState<Service[]>([])
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [showNewService, setShowNewService] = useState(false)
  const [newServiceForm, setNewServiceForm] = useState({
    name: '', description: '', price: '', duration_minutes: '30',
  })

  // ── Bonos ──────────────────────────────────────────────────────────
  const [bonos, setBonos]         = useState<Bono[]>([])
  const [showNewBono, setShowNewBono] = useState(false)
  const [newBonoForm, setNewBonoForm] = useState({
    name: '', service_id: '', total_sessions: '10', price: '',
  })

  // ── Ventas ─────────────────────────────────────────────────────────
  const [ventasSubTab, setVentasSubTab] = useState<VentasSubTab>('activos')
  const [clientBonos, setClientBonos]   = useState<ClientBono[]>([])
  const [showAssign, setShowAssign]     = useState(false)
  const [assignForm, setAssignForm]     = useState({
    bono_id: '', client_name: '', client_email: '', client_phone: '', notes: '',
  })
  const [bonoRequests, setBonoRequests] = useState<BonoRequest[]>([])
  const [reqFilter, setReqFilter]       = useState<'all' | 'pending' | 'paid' | 'cancelled'>('pending')
  const [reqLoading, setReqLoading]     = useState(false)

  // ── Informes ───────────────────────────────────────────────────────
  const now          = new Date()
  const currentYear  = now.getFullYear()
  const currentQ     = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4
  const [informesYear, setInformesYear] = useState(currentYear)
  const [informesQ, setInformesQ]       = useState<1 | 2 | 3 | 4>(currentQ)
  const [billingData, setBillingData]   = useState<BillingData | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

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

  async function loadRequests() {
    setReqLoading(true)
    const r = await fetch('/api/admin/bono-requests')
    if (r.ok) { const d = await r.json(); setBonoRequests(d.requests ?? []) }
    setReqLoading(false)
  }

  async function loadBilling() {
    setBillingLoading(true)
    const { from, to } = getQuarterRange(informesYear, informesQ)
    const r = await fetch(`/api/admin/billing?from=${from}&to=${to}`)
    if (r.ok) { const d = await r.json(); setBillingData(d) }
    setBillingLoading(false)
  }

  useEffect(() => {
    if (tab === 'ventas' && ventasSubTab === 'solicitudes') loadRequests()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ventasSubTab])

  useEffect(() => {
    if (tab === 'informes') {
      setBillingData(null)
      loadBilling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, informesQ, informesYear])

  async function updateRequestStatus(id: string, status: 'paid' | 'cancelled') {
    const r = await fetch('/api/admin/bono-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (r.ok) {
      setBonoRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req))
      if (status === 'paid') loadAll()
    }
  }

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
        name:              newServiceForm.name,
        description:       newServiceForm.description || null,
        price:             newServiceForm.price ? parseFloat(newServiceForm.price) : null,
        duration_minutes:  parseInt(newServiceForm.duration_minutes),
      }),
    })
    if (r.ok) {
      const d = await r.json()
      setServices(s => [...s, d.service])
      setShowNewService(false)
      setNewServiceForm({ name: '', description: '', price: '', duration_minutes: '30' })
    }
    setSaving(false)
  }

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
        name:           newBonoForm.name,
        service_id:     newBonoForm.service_id || null,
        total_sessions: parseInt(newBonoForm.total_sessions),
        price:          newBonoForm.price ? parseFloat(newBonoForm.price) : null,
      }),
    })
    if (r.ok) {
      await loadAll()
      setShowNewBono(false)
      setNewBonoForm({ name: '', service_id: '', total_sessions: '10', price: '' })
    }
    setSaving(false)
  }

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

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto" style={{ background: 'var(--bg)' }}>
      <BrandHeader section="Comercial" />

      <div className="px-5 pt-5 mb-6">
        <h1 className="font-display italic text-[28px] leading-none" style={{ color: 'var(--ink)' }}>Comercial</h1>
      </div>

      {/* Tab bar */}
      <div className="px-5 mb-5">
        <div className="flex rounded-xl p-1 gap-0.5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          {(['servicios', 'bonos', 'ventas', 'informes'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 text-[11px] font-semibold rounded-lg transition-colors"
              style={tab === t
                ? { background: 'var(--primary)', color: '#fff' }
                : { color: 'var(--ink-3)' }
              }
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* ── SERVICIOS ──────────────────────────────────────────────────── */}
        {tab === 'servicios' && (
          <>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              {services.map((sv, i) => (
                <div key={sv.id}>
                  {i > 0 && <div style={{ borderTop: '1px solid var(--line)' }} />}
                  {editingService?.id === sv.id ? (
                    <div className="p-4 flex flex-col gap-3">
                      <Field label="Nombre">
                        <input
                          value={editingService.name ?? ''}
                          onChange={e => setEditingService(p => ({ ...p, name: e.target.value }))}
                          className={INPUT}
                          style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                        />
                      </Field>
                      <Field label="Descripción (opcional)">
                        <input
                          value={editingService.description ?? ''}
                          onChange={e => setEditingService(p => ({ ...p, description: e.target.value || null }))}
                          placeholder="Ej. Tratamiento completo de uñas y callos"
                          className={INPUT}
                          style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                        />
                      </Field>
                      <div className="flex gap-2">
                        <Field label="Precio (€)">
                          <input
                            type="number"
                            value={editingService.price ?? ''}
                            onChange={e => setEditingService(p => ({ ...p, price: e.target.value ? parseFloat(e.target.value) : null }))}
                            placeholder="0.00"
                            className={INPUT}
                            style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                          />
                        </Field>
                        <Field label="Duración (min)">
                          <input
                            type="number"
                            value={editingService.duration_minutes ?? ''}
                            onChange={e => setEditingService(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                            className={INPUT}
                            style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                          />
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveService} disabled={saving} className={BTN_PRIMARY}
                          style={{ background: 'var(--primary)', color: '#fff' }}>
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingService(null)} className={BTN_GHOST}
                          style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-3.5 pl-4 pr-5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"
                          style={{ color: sv.is_active ? 'var(--ink)' : 'var(--ink-3)', textDecoration: sv.is_active ? 'none' : 'line-through' }}>
                          {sv.name}
                        </p>
                        {sv.description && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-3)' }}>{sv.description}</p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                          {sv.duration_minutes} min{sv.price != null ? ` · ${sv.price}€` : ''}
                        </p>
                      </div>
                      <button onClick={() => setEditingService(sv)}
                        className="text-xs px-2 py-1 shrink-0 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--primary)' }}>
                        Editar
                      </button>
                      <Toggle active={sv.is_active} onToggle={() => toggleService(sv.id, !sv.is_active)} />
                    </div>
                  )}
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--ink-3)' }}>No hay servicios</p>
              )}
            </div>

            {showNewService ? (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <div className="text-[9.5px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>Nuevo servicio</div>
                <Field label="Nombre *">
                  <input
                    value={newServiceForm.name}
                    onChange={e => setNewServiceForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Quiropedia General"
                    className={INPUT}
                    style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </Field>
                <Field label="Descripción (opcional)">
                  <input
                    value={newServiceForm.description}
                    onChange={e => setNewServiceForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ej. Tratamiento completo de uñas y callos"
                    className={INPUT}
                    style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </Field>
                <div className="flex gap-2">
                  <Field label="Precio (€)">
                    <input
                      type="number"
                      value={newServiceForm.price}
                      onChange={e => setNewServiceForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      className={INPUT}
                      style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>
                  <Field label="Duración (min)">
                    <input
                      type="number"
                      value={newServiceForm.duration_minutes}
                      onChange={e => setNewServiceForm(p => ({ ...p, duration_minutes: e.target.value }))}
                      className={INPUT}
                      style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={createService} disabled={saving} className={BTN_PRIMARY}
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    {saving ? 'Creando...' : 'Crear servicio'}
                  </button>
                  <button onClick={() => setShowNewService(false)} className={BTN_GHOST}
                    style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewService(true)}
                className="w-full py-4 rounded-xl text-sm transition-opacity hover:opacity-70"
                style={{ border: '1.5px dashed var(--line)', color: 'var(--ink-3)' }}>
                + Añadir servicio
              </button>
            )}
          </>
        )}

        {/* ── BONOS ──────────────────────────────────────────────────────── */}
        {tab === 'bonos' && (
          <>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-3)' }}>
              Los bonos activos se descuentan automáticamente cuando el cliente reserva cita con su email registrado.
            </p>

            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              {bonos.map((bn, i) => (
                <div key={bn.id}>
                  {i > 0 && <div style={{ borderTop: '1px solid var(--line)' }} />}
                  <div className="flex items-center gap-3 py-3.5 pl-4 pr-5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate"
                        style={{ color: bn.is_active ? 'var(--ink)' : 'var(--ink-3)', textDecoration: bn.is_active ? 'none' : 'line-through' }}>
                        {bn.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {bn.total_sessions} sesiones
                        {bn.price != null ? ` · ${bn.price}€` : ''}
                        {' · '}{bn.services?.name ?? 'Todos los servicios'}
                      </p>
                    </div>
                    <Toggle active={bn.is_active} onToggle={() => toggleBono(bn.id, !bn.is_active)} />
                  </div>
                </div>
              ))}
              {bonos.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--ink-3)' }}>No hay bonos configurados</p>
              )}
            </div>

            {showNewBono ? (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <div className="text-[9.5px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>Nuevo bono</div>
                <Field label="Nombre *">
                  <input
                    value={newBonoForm.name}
                    onChange={e => setNewBonoForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Bono 10 sesiones"
                    className={INPUT}
                    style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </Field>
                <Field label="Servicio asociado">
                  <select
                    value={newBonoForm.service_id}
                    onChange={e => setNewBonoForm(p => ({ ...p, service_id: e.target.value }))}
                    className={INPUT}
                    style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  >
                    <option value="">Válido para todos los servicios</option>
                    {services.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
                <div className="flex gap-2">
                  <Field label="Nº sesiones">
                    <input
                      type="number"
                      value={newBonoForm.total_sessions}
                      onChange={e => setNewBonoForm(p => ({ ...p, total_sessions: e.target.value }))}
                      className={INPUT}
                      style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>
                  <Field label="Precio total (€)">
                    <input
                      type="number"
                      value={newBonoForm.price}
                      onChange={e => setNewBonoForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      className={INPUT}
                      style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={createBono} disabled={saving} className={BTN_PRIMARY}
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    {saving ? 'Creando...' : 'Crear bono'}
                  </button>
                  <button onClick={() => setShowNewBono(false)} className={BTN_GHOST}
                    style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewBono(true)}
                className="w-full py-4 rounded-xl text-sm transition-opacity hover:opacity-70"
                style={{ border: '1.5px dashed var(--line)', color: 'var(--ink-3)' }}>
                + Añadir bono
              </button>
            )}
          </>
        )}

        {/* ── VENTAS ─────────────────────────────────────────────────────── */}
        {tab === 'ventas' && (
          <>
            {/* Sub-tab toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--line)' }}>
              {(['activos', 'solicitudes'] as VentasSubTab[]).map(st => (
                <button
                  key={st}
                  onClick={() => setVentasSubTab(st)}
                  className="flex-1 py-2 text-xs font-semibold transition-colors"
                  style={ventasSubTab === st
                    ? { background: 'var(--primary-soft)', color: 'var(--primary)', borderBottom: '2px solid var(--primary)' }
                    : { background: 'var(--card)', color: 'var(--ink-3)' }
                  }
                >
                  {st === 'activos' ? 'Bonos activos' : 'Solicitudes'}
                </button>
              ))}
            </div>

            {/* Bonos activos (cliente_bonos) */}
            {ventasSubTab === 'activos' && (
              <>
                {clientBonos.map(cb => {
                  const pct = cb.total_sessions > 0 ? (cb.remaining_sessions / cb.total_sessions) * 100 : 0
                  return (
                    <div key={cb.id} className="rounded-xl p-4"
                      style={{ background: 'var(--card)', border: '1px solid var(--line)', opacity: cb.is_active ? 1 : 0.5 }}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{cb.client_name}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-3)' }}>{cb.client_email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                            {cb.remaining_sessions}
                            <span className="text-xs font-normal" style={{ color: 'var(--ink-3)' }}>/{cb.total_sessions}</span>
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>sesiones</p>
                        </div>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--ink-3)' }}>{cb.bonos?.name ?? 'Bono'}</p>
                      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--line)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                      <div className="flex gap-2">
                        {cb.is_active && cb.remaining_sessions > 0 ? (
                          <button onClick={() => useBono(cb.id)}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                            style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                            Usar sesión manualmente
                          </button>
                        ) : (
                          <p className="flex-1 text-center text-xs py-2" style={{ color: 'var(--ink-3)' }}>Bono agotado</p>
                        )}
                        <a
                          href={`/api/admin/client-bonos/${cb.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 flex items-center gap-1 shrink-0"
                          style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
                          title="Descargar vale PDF"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          PDF
                        </a>
                      </div>
                    </div>
                  )
                })}

                {clientBonos.length === 0 && (
                  <p className="text-center text-sm py-8" style={{ color: 'var(--ink-3)' }}>No hay bonos asignados a clientes</p>
                )}

                {showAssign ? (
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                    <div className="text-[9.5px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>Asignar bono a cliente</div>
                    <Field label="Bono">
                      <select
                        value={assignForm.bono_id}
                        onChange={e => setAssignForm(p => ({ ...p, bono_id: e.target.value }))}
                        className={INPUT}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      >
                        <option value="">Seleccionar bono...</option>
                        {bonos.filter(b => b.is_active).map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.total_sessions} sesiones)</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Nombre del cliente *">
                      <input
                        value={assignForm.client_name}
                        onChange={e => setAssignForm(p => ({ ...p, client_name: e.target.value }))}
                        className={INPUT}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      />
                    </Field>
                    <Field label="Email del cliente *">
                      <input
                        type="email"
                        value={assignForm.client_email}
                        onChange={e => setAssignForm(p => ({ ...p, client_email: e.target.value }))}
                        className={INPUT}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      />
                    </Field>
                    <Field label="Teléfono (opcional)">
                      <input
                        type="tel"
                        value={assignForm.client_phone}
                        onChange={e => setAssignForm(p => ({ ...p, client_phone: e.target.value }))}
                        className={INPUT}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      />
                    </Field>
                    <Field label="Notas (opcional)">
                      <textarea
                        value={assignForm.notes}
                        onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))}
                        className={`${INPUT} resize-none`}
                        rows={2}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <button onClick={assignBono} disabled={saving} className={BTN_PRIMARY}
                        style={{ background: 'var(--primary)', color: '#fff' }}>
                        {saving ? 'Asignando...' : 'Asignar bono'}
                      </button>
                      <button onClick={() => setShowAssign(false)} className={BTN_GHOST}
                        style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAssign(true)}
                    className="w-full py-4 rounded-xl text-sm transition-opacity hover:opacity-70"
                    style={{ border: '1.5px dashed var(--line)', color: 'var(--ink-3)' }}>
                    + Asignar bono a cliente
                  </button>
                )}
              </>
            )}

            {/* Solicitudes de bonos */}
            {ventasSubTab === 'solicitudes' && (
              <>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'paid', 'cancelled'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReqFilter(f)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                      style={reqFilter === f
                        ? { background: 'var(--primary)', color: '#fff', border: '1px solid var(--primary)' }
                        : { border: '1px solid var(--line)', color: 'var(--ink-3)' }
                      }
                    >
                      {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'paid' ? 'Pagadas' : 'Canceladas'}
                    </button>
                  ))}
                </div>

                {reqLoading && <p className="text-sm text-center py-8" style={{ color: 'var(--ink-3)' }}>Cargando...</p>}

                {!reqLoading && bonoRequests.filter(r => reqFilter === 'all' || r.status === reqFilter).length === 0 && (
                  <p className="text-center text-sm py-8" style={{ color: 'var(--ink-3)' }}>No hay solicitudes</p>
                )}

                {bonoRequests
                  .filter(r => reqFilter === 'all' || r.status === reqFilter)
                  .map(req => {
                    const bono        = req.bonos
                    const isPending   = req.status === 'pending'
                    const isPaid      = req.status === 'paid'
                    const isCancelled = req.status === 'cancelled'
                    return (
                      <div key={req.id} className="rounded-xl p-4"
                        style={{ background: 'var(--card)', border: '1px solid var(--line)', opacity: isCancelled ? 0.5 : 1 }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{req.buyer_name}</p>
                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-3)' }}>{req.buyer_email} · {req.buyer_phone}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={isPending
                              ? { background: 'var(--warn-soft)', color: 'var(--warn)' }
                              : isPaid
                              ? { background: 'var(--ok-soft)', color: 'var(--ok)' }
                              : { background: 'var(--field)', color: 'var(--ink-3)' }
                            }>
                            {isPending ? 'Pendiente' : isPaid ? 'Pagado' : 'Cancelado'}
                          </span>
                        </div>

                        <div className="rounded-lg px-3 py-2 mb-2" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--primary)' }}>{bono?.name ?? 'Bono'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                            {bono?.total_sessions} sesiones · {bono?.services?.name ?? 'Todos los servicios'}
                            {bono?.price != null ? ` · ${bono.price.toFixed(2)} €` : ''}
                          </p>
                        </div>

                        {req.is_gift && req.recipient_name && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>🎁 Regalo para</span>
                            <span className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>{req.recipient_name}</span>
                            {req.recipient_email && <span className="text-[10px] truncate" style={{ color: 'var(--ink-3)' }}>({req.recipient_email})</span>}
                          </div>
                        )}

                        <p className="text-[10px] mb-3" style={{ color: 'var(--ink-3)' }}>
                          {new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {isPending && (
                          <div className="flex gap-2">
                            <button onClick={() => updateRequestStatus(req.id, 'paid')}
                              className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                              style={{ background: 'var(--primary)', color: '#fff' }}>
                              Marcar como pagado
                            </button>
                            <button onClick={() => updateRequestStatus(req.id, 'cancelled')}
                              className="px-3 py-2 rounded-lg text-xs transition-opacity hover:opacity-70"
                              style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </>
            )}
          </>
        )}

        {/* ── INFORMES ───────────────────────────────────────────────────── */}
        {tab === 'informes' && (
          <>
            {/* Trimestre + año */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {([1, 2, 3, 4] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setInformesQ(q)}
                    className="w-10 h-9 rounded-lg text-xs font-bold transition-colors"
                    style={informesQ === q
                      ? { background: 'var(--primary)', color: '#fff' }
                      : { border: '1px solid var(--line)', color: 'var(--ink-3)' }
                    }
                  >
                    T{q}
                  </button>
                ))}
              </div>
              <select
                value={informesYear}
                onChange={e => setInformesYear(Number(e.target.value))}
                className="text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none"
                style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              >
                {[currentYear, currentYear - 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {billingLoading && (
              <p className="text-sm text-center py-10" style={{ color: 'var(--ink-3)' }}>Calculando...</p>
            )}

            {!billingLoading && billingData && (
              <>
                {/* KPI card */}
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                  <div className="px-4 pt-4 pb-3">
                    <div className="text-[9px] font-bold tracking-[0.18em] uppercase mb-1.5" style={{ color: 'var(--ink-3)' }}>
                      Total facturado · T{informesQ} {informesYear}
                    </div>
                    <div className="text-[34px] font-bold leading-none" style={{ color: 'var(--ink)' }}>
                      {billingData.totalFacturado.toFixed(2).replace('.', ',')}
                      <span className="text-[20px] font-semibold ml-1" style={{ color: 'var(--ink-3)' }}>€</span>
                    </div>
                  </div>
                  <div className="flex" style={{ borderTop: '1px solid var(--line)' }}>
                    <div className="flex-1 px-4 py-3">
                      <div className="text-[9px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>Consultas</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                        {billingData.totalCitas.toFixed(2).replace('.', ',')} €
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{billingData.numCitas} citas</div>
                    </div>
                    <div className="flex-1 px-4 py-3" style={{ borderLeft: '1px solid var(--line)' }}>
                      <div className="text-[9px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>Bonos vendidos</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                        {billingData.totalBonos.toFixed(2).replace('.', ',')} €
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{billingData.numBonos} bonos</div>
                    </div>
                  </div>
                </div>

                {/* Gráfico por servicio */}
                {billingData.porServicio.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                    <div className="text-[9px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--ink-3)' }}>
                      Ingresos por servicio
                    </div>
                    <div className="flex flex-col gap-3.5">
                      {billingData.porServicio.map((s, i) => {
                        const max = billingData.porServicio[0].revenue
                        const pct = max > 0 ? (s.revenue / max) * 100 : 0
                        return (
                          <div key={i}>
                            <div className="flex items-baseline justify-between mb-1.5">
                              <span className="text-xs font-medium truncate mr-2 max-w-[55%]" style={{ color: 'var(--ink)' }}>
                                {s.name}
                              </span>
                              <span className="text-[11px] shrink-0" style={{ color: 'var(--ink-3)' }}>
                                {s.revenue.toFixed(0)} € · {s.count} cita{s.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: 'var(--primary)', transition: 'width 0.4s ease' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Export */}
                {billingData.lineItems.length > 0 ? (
                  <button
                    onClick={() => exportCSV(billingData.lineItems, informesQ, informesYear)}
                    className="w-full py-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    Exportar CSV para Hacienda
                  </button>
                ) : (
                  <p className="text-center text-sm py-6" style={{ color: 'var(--ink-3)' }}>
                    Sin datos para este período
                  </p>
                )}
              </>
            )}
          </>
        )}

      </div>
    </main>
  )
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{ background: active ? 'var(--primary)' : 'var(--line)' }}
    >
      <span
        className="absolute top-1 left-0 w-4 h-4 rounded-full transition-transform"
        style={{ background: 'var(--bg)', transform: active ? 'translateX(20px)' : 'translateX(4px)' }}
      />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-1.5" style={{ color: 'var(--ink-3)' }}>{label}</div>
      {children}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Bono {
  id: string
  name: string
  total_sessions: number
  price: number | null
  services: { name: string } | null
}

interface FormState {
  name: string; email: string; phone: string
  is_gift: boolean; recipient_name: string; recipient_email: string
}

type Status = 'idle' | 'sending' | 'ok' | 'error'

const INPUT = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"

export default function BonosPage() {
  const [bonos, setBonos] = useState<Bono[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Bono | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', is_gift: false, recipient_name: '', recipient_email: '',
  })
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    fetch('/api/bonos')
      .then(r => r.json())
      .then(d => setBonos(d.bonos ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setStatus('sending')
    try {
      const res = await fetch('/api/bonos/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bono_id: selected.id, client_name: form.name, client_email: form.email, client_phone: form.phone,
          is_gift: form.is_gift,
          recipient_name:  form.is_gift ? form.recipient_name  : undefined,
          recipient_email: form.is_gift ? form.recipient_email : undefined,
        }),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch { setStatus('error') }
  }

  function closeModal() {
    setSelected(null); setStatus('idle')
    setForm({ name: '', email: '', phone: '', is_gift: false, recipient_name: '', recipient_email: '' })
  }

  return (
    <main className="min-h-screen px-5 py-10 max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
      <Link href="/book" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </Link>

      <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'var(--primary)' }}>Bonos</p>
      <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>Sesiones</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--ink-3)' }}>
        Ahorra comprando sesiones por adelantado. También puedes regalar un bono.
      </p>

      {loading && <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Cargando bonos...</p>}
      {!loading && bonos.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No hay bonos disponibles en este momento.</p>
      )}

      <div className="flex flex-col gap-3">
        {bonos.map(bono => (
          <div
            key={bono.id}
            className="rounded-2xl p-5"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-lg leading-tight mb-1" style={{ color: 'var(--ink)' }}>{bono.name}</p>
                <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                  {bono.total_sessions} sesiones · {bono.services?.name ?? 'Todos los servicios'}
                </p>
                {bono.price != null && (
                  <p className="font-bold text-2xl mt-2" style={{ color: 'var(--primary)' }}>
                    {bono.price.toFixed(2)} €
                  </p>
                )}
              </div>
              <button
                onClick={() => { setSelected(bono); setStatus('idle') }}
                className="shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Solicitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
          style={{ background: 'rgba(28,40,38,0.5)' }}
        >
          <div
            className="w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)' }}
          >
            {status === 'ok' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--ok-soft)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>Solicitud enviada</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                  Nos pondremos en contacto contigo para confirmar la compra del bono{' '}
                  <strong style={{ color: 'var(--ink)' }}>{selected.name}</strong>.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 w-full py-3 rounded-xl font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display italic text-xl mb-1" style={{ color: 'var(--ink)' }}>{selected.name}</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-3)' }}>
                  {selected.total_sessions} sesiones · {selected.services?.name ?? 'Todos los servicios'}
                  {selected.price != null && ` · ${selected.price.toFixed(2)} €`}
                </p>

                {/* Toggle para mí / regalo */}
                <div className="flex rounded-xl p-0.5 mb-4" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
                  {[false, true].map(gift => (
                    <button
                      key={String(gift)}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_gift: gift }))}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
                      style={form.is_gift === gift
                        ? { background: 'var(--primary)', color: '#fff' }
                        : { color: 'var(--ink-3)' }
                      }
                    >
                      {gift ? '🎁 Como regalo' : 'Para mí'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {[
                    { key: 'name', label: form.is_gift ? 'Tu nombre (comprador)' : 'Nombre', type: 'text', placeholder: 'Tu nombre' },
                    { key: 'email', label: form.is_gift ? 'Tu email (comprador)' : 'Email', type: 'email', placeholder: 'tu@email.com' },
                    { key: 'phone', label: 'Teléfono', type: 'tel', placeholder: '600 000 000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{f.label}</label>
                      <input
                        required type={f.type} placeholder={f.placeholder}
                        value={form[f.key as keyof FormState] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className={INPUT}
                        style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      />
                    </div>
                  ))}

                  {form.is_gift && (
                    <div className="border-t pt-3 flex flex-col gap-3" style={{ borderColor: 'var(--line)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>Destinatario del regalo</p>
                      {[
                        { key: 'recipient_name', label: 'Nombre del destinatario', type: 'text', placeholder: 'Nombre' },
                        { key: 'recipient_email', label: 'Email del destinatario', type: 'email', placeholder: 'email@destinatario.com' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{f.label}</label>
                          <input
                            required type={f.type} placeholder={f.placeholder}
                            value={form[f.key as keyof FormState] as string}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className={INPUT}
                            style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {status === 'error' && (
                    <p className="text-sm" style={{ color: 'var(--danger)' }}>Ha ocurrido un error. Inténtalo de nuevo.</p>
                  )}

                  <button
                    type="submit" disabled={status === 'sending'}
                    className="mt-2 w-full py-3 rounded-xl font-semibold transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {status === 'sending' ? 'Enviando...' : form.is_gift ? '🎁 Enviar regalo' : 'Enviar solicitud'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
                    Cancelar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

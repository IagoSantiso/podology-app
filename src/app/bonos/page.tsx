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
  name: string
  email: string
  phone: string
  is_gift: boolean
  recipient_name: string
  recipient_email: string
}

type Status = 'idle' | 'sending' | 'ok' | 'error'

export default function BonosPage() {
  const [bonos, setBonos] = useState<Bono[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Bono | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '',
    is_gift: false,
    recipient_name: '', recipient_email: '',
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bono_id:        selected.id,
          client_name:    form.name,
          client_email:   form.email,
          client_phone:   form.phone,
          is_gift:        form.is_gift,
          recipient_name:  form.is_gift ? form.recipient_name  : undefined,
          recipient_email: form.is_gift ? form.recipient_email : undefined,
        }),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  function closeModal() {
    setSelected(null)
    setStatus('idle')
    setForm({ name: '', email: '', phone: '', is_gift: false, recipient_name: '', recipient_email: '' })
  }

  const inputCls = 'w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold placeholder-muted'

  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <Link href="/book" className="text-muted text-sm hover:text-gold transition-colors block mb-8">
        ← Volver
      </Link>

      <h1 className="font-display text-3xl font-bold text-gold mb-2">Bonos</h1>
      <p className="text-muted text-sm mb-8">
        Ahorra comprando sesiones por adelantado. También puedes regalar un bono a alguien especial.
      </p>

      {loading && <p className="text-muted text-sm">Cargando bonos...</p>}
      {!loading && bonos.length === 0 && (
        <p className="text-muted text-sm">No hay bonos disponibles en este momento.</p>
      )}

      <div className="flex flex-col gap-4">
        {bonos.map(bono => (
          <div key={bono.id} className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-cream text-lg leading-tight">{bono.name}</p>
                <p className="text-muted text-sm mt-1">
                  {bono.total_sessions} sesiones · {bono.services?.name ?? 'Todos los servicios'}
                </p>
                {bono.price != null && (
                  <p className="text-gold font-bold text-xl mt-2">{bono.price.toFixed(2)} €</p>
                )}
              </div>
              <button
                onClick={() => { setSelected(bono); setStatus('idle') }}
                className="shrink-0 bg-gold text-bg font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
              >
                Solicitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-bg-card border border-border rounded-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            {status === 'ok' ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">{form.is_gift ? '🎁' : '✅'}</p>
                <p className="font-semibold text-cream text-lg">Solicitud enviada</p>
                <p className="text-muted text-sm mt-2">
                  {form.is_gift
                    ? `Hemos enviado un email a ${form.recipient_name} con los detalles del regalo. Nos pondremos en contacto contigo para el pago.`
                    : `Nos pondremos en contacto contigo para confirmar la compra del bono `}
                  {!form.is_gift && <strong className="text-cream">{selected.name}</strong>}.
                </p>
                <p className="text-muted text-xs mt-2">Revisa tu email — te hemos enviado un resguardo.</p>
                <button onClick={closeModal} className="mt-6 w-full bg-gold text-bg font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-gold mb-1">{selected.name}</h2>
                <p className="text-muted text-sm mb-4">
                  {selected.total_sessions} sesiones · {selected.services?.name ?? 'Todos los servicios'}
                  {selected.price != null && ` · ${selected.price.toFixed(2)} €`}
                </p>

                {/* Para mí / Regalo toggle */}
                <div className="flex bg-bg border border-border rounded-lg p-0.5 mb-4 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_gift: false }))}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${!form.is_gift ? 'bg-gold text-bg' : 'text-muted hover:text-cream'}`}
                  >
                    Para mí
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_gift: true }))}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${form.is_gift ? 'bg-gold text-bg' : 'text-muted hover:text-cream'}`}
                  >
                    🎁 Como regalo
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* Buyer fields */}
                  <div>
                    <label className="text-muted text-xs uppercase tracking-wide block mb-1">
                      {form.is_gift ? 'Tu nombre (comprador)' : 'Nombre'}
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inputCls}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="text-muted text-xs uppercase tracking-wide block mb-1">
                      {form.is_gift ? 'Tu email (comprador)' : 'Email'}
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputCls}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-muted text-xs uppercase tracking-wide block mb-1">Teléfono</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputCls}
                      placeholder="600 000 000"
                    />
                  </div>

                  {/* Recipient fields (gift only) */}
                  {form.is_gift && (
                    <div className="border-t border-border pt-3 flex flex-col gap-3">
                      <p className="text-gold text-xs font-semibold uppercase tracking-wide">Destinatario del regalo</p>
                      <div>
                        <label className="text-muted text-xs uppercase tracking-wide block mb-1">Nombre del destinatario</label>
                        <input
                          required
                          value={form.recipient_name}
                          onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
                          className={inputCls}
                          placeholder="Nombre de quien recibe el regalo"
                        />
                      </div>
                      <div>
                        <label className="text-muted text-xs uppercase tracking-wide block mb-1">Email del destinatario</label>
                        <input
                          required
                          type="email"
                          value={form.recipient_email}
                          onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
                          className={inputCls}
                          placeholder="email@destinatario.com"
                        />
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <p className="text-red-400 text-sm">Ha ocurrido un error. Inténtalo de nuevo.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="mt-2 w-full bg-gold text-bg font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {status === 'sending' ? 'Enviando...' : form.is_gift ? '🎁 Enviar regalo' : 'Enviar solicitud'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-muted text-sm hover:text-cream transition-colors">
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

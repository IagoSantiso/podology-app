'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INPUT = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"

export default function GuestPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Nombre y teléfono son obligatorios')
      return
    }
    sessionStorage.setItem('guest', JSON.stringify(form))
    router.push('/book/select')
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        <Link href="/book/login" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </Link>

        <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'var(--primary)' }}>Tus datos</p>
        <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>¿Cómo te llamamos?</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--ink-3)' }}>Solo necesitamos esto para confirmarte la cita</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Nombre completo *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="Ana García" autoComplete="name"
              className={INPUT}
              style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Teléfono *</label>
            <input
              name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="+34 600 000 000" autoComplete="tel"
              className={INPUT}
              style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>
              Email <span className="font-normal">(opcional — para confirmación)</span>
            </label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="ana@email.com" autoComplete="email"
              className={INPUT}
              style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <label className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--ink-3)' }}>
            <input type="checkbox" required className="mt-0.5 shrink-0" style={{ accentColor: 'var(--primary)' }} />
            <span>
              He leído y acepto la{' '}
              <a href="/privacidad" target="_blank" className="underline" style={{ color: 'var(--primary)' }}>
                política de privacidad
              </a>
            </span>
          </label>

          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            className="mt-2 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)' }}
          >
            Elegir fecha y servicio →
          </button>
        </form>

      </div>
    </main>
  )
}

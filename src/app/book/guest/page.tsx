'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GuestPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Completa todos los campos')
      return
    }
    sessionStorage.setItem('guest', JSON.stringify(form))
    router.push('/book/select')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/book" className="text-muted text-sm hover:text-gold transition-colors mb-8 inline-flex items-center gap-1">
          ← Volver
        </Link>

        <h1 className="font-display text-3xl font-bold text-cream mt-4">Tus datos</h1>
        <p className="text-muted text-sm mt-1 mb-8">Solo necesitamos esto para confirmarte la cita</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Nombre completo</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Carlos García"
              autoComplete="name"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="carlos@email.com"
              autoComplete="email"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Teléfono</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+34 600 000 000"
              autoComplete="tel"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <label className="flex items-start gap-2 text-sm text-gray-400">
            <input type="checkbox" required className="mt-1 accent-amber-500" />
            <span>
              He leído y acepto la{' '}
              <a href="/privacidad" target="_blank" className="underline text-amber-500">
                política de privacidad
              </a>
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 bg-gold hover:bg-gold-dark text-bg font-semibold rounded-lg px-4 py-3.5 transition-colors"
          >
            Elegir fecha y servicio →
          </button>
        </form>
      </div>
    </main>
  )
}

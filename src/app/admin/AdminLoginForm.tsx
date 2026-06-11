'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginForm({ name }: { name: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-10 transition-opacity hover:opacity-70"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--primary)', boxShadow: 'var(--shadow)' }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M6 26 Q6 10 16 8 Q26 10 26 26" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h1 className="font-display italic text-3xl mb-1" style={{ color: 'var(--ink)' }}>Acceso profesional</h1>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Panel de gestión de {name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>
              Correo electrónico
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="patricia@podologia.es" autoComplete="email"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"
                style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"
                style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {loading ? 'Entrando...' : 'Entrar al panel'}
          </button>
        </form>

        <p className="text-sm text-center mt-5">
          <Link href="/admin/reset-password" className="transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

      </div>
    </main>
  )
}

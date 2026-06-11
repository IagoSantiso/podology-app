'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'

const INPUT = "w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"

export default function BookPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Introduce tu email'); return }
    if (!password) { setError('Introduce tu contraseña'); return }
    setLoading(true)
    const supabase = createSupabaseClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Email o contraseña incorrectos'); return }
    router.push('/book/select')
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-8 transition-opacity hover:opacity-70"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>

        {/* Header */}
        <h1 className="font-display italic text-3xl mb-1" style={{ color: 'var(--ink)' }}>Reserva tu cita</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--ink-3)' }}>Sin registro, en menos de un minuto</p>

        {/* Guest card */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--primary-soft)', border: '1.5px solid var(--primary)' }}>
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--ink)' }}>Reservar como invitado</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-3)' }}>La forma más rápida de pedir cita</p>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 mb-5">
            {['Sin crear cuenta ni contraseña', 'Solo tu nombre y teléfono'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)', flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/book/guest"
            className="w-full flex items-center justify-center gap-2 font-semibold text-base py-4 rounded-2xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            Reservar ahora
          </Link>
        </div>

        {/* Login section */}
        <p className="text-sm text-center mb-4" style={{ color: 'var(--ink-3)' }}>¿Ya tienes cuenta?</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email"
              className={INPUT + " pl-10"}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña" autoComplete="current-password"
              className={INPUT + " pl-10"}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {loading ? 'Procesando...' : 'Acceder a mi cuenta'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-4">
          <Link
            href="/book/signup"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            Crear cuenta nueva
          </Link>
          <Link href="/forgot-password" className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'

const INPUT = "w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Introduce tu nombre'); return }
    if (!phone.trim()) { setError('Introduce tu teléfono'); return }
    if (!email.trim()) { setError('Introduce tu email'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName: fullName.trim(), phone: phone.trim() }),
    })
    const body = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(body.error ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.')
      return
    }

    const supabase = createSupabaseClient()
    await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    setCreated(true)
  }

  if (created) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--ok-soft)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-display italic text-2xl mb-2" style={{ color: 'var(--ink)' }}>¡Cuenta creada!</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Tu cuenta está lista. Ya puedes gestionar tus citas.
          </p>
          <button
            onClick={() => router.push('/book/select')}
            className="mt-6 w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Acceder a mi cuenta
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        {/* Back */}
        <Link
          href="/book"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-8 transition-opacity hover:opacity-70"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>

        <h1 className="font-display italic text-3xl mb-1" style={{ color: 'var(--ink)' }}>Crear cuenta</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--ink-3)' }}>Gestiona tus citas fácilmente</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Nombre completo" autoComplete="name"
              className={INPUT + " pl-10"}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.58 4.92 2 2 0 0 1 3.55 2.73h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.9-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 17z"/>
              </svg>
            </span>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Teléfono" autoComplete="tel"
              className={INPUT + " pl-10"}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

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
              placeholder="Contraseña (mín. 6 caracteres)" autoComplete="new-password"
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
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña" autoComplete="new-password"
              className={INPUT + " pl-10"}
              style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-50 mt-1"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-sm text-center mt-5" style={{ color: 'var(--ink-3)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/book" className="font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--primary)' }}>
            Acceder
          </Link>
        </p>

      </div>
    </main>
  )
}

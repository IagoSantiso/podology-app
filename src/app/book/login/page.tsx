'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'

type Mode = 'signup' | 'login'

const INPUT = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const [showLogin, setShowLogin] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(authError === 'auth' ? 'El enlace ha caducado. Inténtalo de nuevo.' : '')
  const [emailSent, setEmailSent] = useState(false)

  function switchMode(m: Mode) {
    setMode(m); setError(''); setPassword(''); setConfirm('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Introduce tu email'); return }
    if (!password) { setError('Introduce tu contraseña'); return }
    if (mode === 'signup') {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
      if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    }
    setLoading(true)
    const supabase = createSupabaseClient()
    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/book/select` },
      })
      setLoading(false)
      if (err) {
        setError(err.message.includes('already registered')
          ? 'Ya existe una cuenta con ese email.'
          : 'No se pudo crear la cuenta. Inténtalo de nuevo.')
        return
      }
      setEmailSent(true)
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) { setError('Email o contraseña incorrectos'); return }
      router.push('/book/select')
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--ok-soft)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)' }}>
              <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/>
              <polyline points="2 6 12 13 22 6"/>
            </svg>
          </div>
          <h1 className="font-display italic text-2xl mb-2" style={{ color: 'var(--ink)' }}>Revisa tu email</h1>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
            Hemos enviado un enlace de confirmación a{' '}
            <span style={{ color: 'var(--primary)' }}>{email}</span>.
          </p>
          <button onClick={() => setEmailSent(false)} className="mt-8 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
            Usar otro email
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">

        <Link href="/book" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </Link>

        <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'var(--primary)' }}>Acceso</p>
        <h1 className="font-display italic text-3xl mb-8" style={{ color: 'var(--ink)' }}>¿Cómo quieres continuar?</h1>

        {/* Opción primaria — invitado */}
        <Link
          href="/book/guest"
          className="block rounded-2xl p-5 mb-4 transition-all hover:opacity-95"
          style={{ background: 'var(--primary-soft)', border: '1.5px solid var(--primary)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-base mb-0.5" style={{ color: 'var(--primary-deep)' }}>Reservar como invitada</p>
              <p className="text-sm" style={{ color: 'var(--primary)' }}>Rápido, sin necesidad de cuenta</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </Link>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
          <span className="text-xs" style={{ color: 'var(--ink-3)' }}>o bien</span>
          <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
        </div>

        {/* Opción secundaria — cuenta */}
        {!showLogin ? (
          <button
            onClick={() => setShowLogin(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            Ya tengo cuenta — Acceder
          </button>
        ) : (
          <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
            {/* Tabs */}
            <div className="flex rounded-xl p-0.5 mb-5" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 text-sm rounded-lg transition-colors font-medium"
                  style={mode === m
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { color: 'var(--ink-3)' }
                  }
                >
                  {m === 'login' ? 'Acceder' : 'Crear cuenta'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" autoComplete="email"
                  className={INPUT}
                  style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Contraseña</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className={INPUT}
                  style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                />
              </div>
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Confirmar contraseña</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña" autoComplete="new-password"
                    className={INPUT}
                    style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </div>
              )}
              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                className="mt-1 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {loading ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Suspense } from 'react'

type Mode = 'signup' | 'login'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(authError === 'auth' ? 'El enlace ha caducado. Inténtalo de nuevo.' : '')
  const [emailSent, setEmailSent] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setPassword('')
    setConfirm('')
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
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/book/select` },
      })
      setLoading(false)
      if (err) {
        if (err.message.includes('already registered')) {
          setError('Ya existe una cuenta con ese email. Usa la opción Acceder.')
        } else {
          setError('No se pudo crear la cuenta. Inténtalo de nuevo.')
        }
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="font-display text-2xl font-bold text-cream mb-3">Revisa tu email</h1>
          <p className="text-muted text-sm">
            Hemos enviado un enlace de confirmación a{' '}
            <span className="text-gold">{email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="mt-8 text-sm text-muted hover:text-gold transition-colors"
          >
            Usar otro email
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/book" className="text-muted text-sm hover:text-gold transition-colors mb-8 inline-flex items-center gap-1">
          ← Volver
        </Link>

        <h1 className="font-display text-3xl font-bold text-cream mt-4">
          {mode === 'signup' ? 'Crear cuenta' : 'Acceder'}
        </h1>
        <p className="text-muted text-sm mt-1 mb-8">
          {mode === 'signup' ? 'Guarda tu historial de citas' : 'Entra con tu email y contraseña'}
        </p>

        {/* Tabs */}
        <div className="flex border border-border rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              mode === 'signup' ? 'bg-gold text-bg font-semibold' : 'text-muted hover:text-cream'
            }`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              mode === 'login' ? 'bg-gold text-bg font-semibold' : 'text-muted hover:text-cream'
            }`}
          >
            Acceder
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-muted mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gold hover:bg-gold-dark text-bg font-semibold rounded-lg px-4 py-3.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          ¿Prefieres no crear cuenta?{' '}
          <Link href="/book/guest" className="text-gold hover:underline">Reservar como invitado</Link>
        </p>
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

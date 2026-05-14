'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Introduce tu email'); return }
    setLoading(true)
    setError('')
    const supabase = createSupabaseClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/book/select` },
    })
    setLoading(false)
    if (err) { setError('Error enviando el enlace. Inténtalo de nuevo.'); return }
    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="font-display text-2xl font-bold text-cream mb-3">Revisa tu email</h1>
          <p className="text-muted text-sm">
            Hemos enviado un enlace mágico a <span className="text-gold">{email}</span>.
            Haz clic en él para entrar sin contraseña.
          </p>
          <button
            onClick={() => setSent(false)}
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

        <h1 className="font-display text-3xl font-bold text-cream mt-4">Acceder</h1>
        <p className="text-muted text-sm mt-1 mb-8">
          Te enviamos un enlace mágico — sin contraseña
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Tu email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gold hover:bg-gold-dark text-bg font-semibold rounded-lg px-4 py-3.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
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

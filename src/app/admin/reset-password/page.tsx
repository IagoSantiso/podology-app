'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al enviar el email')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <span className="text-4xl">✂️</span>
          <h1 className="font-display text-3xl font-bold text-gold mt-3">Recuperar acceso</h1>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-cream">
              Te hemos enviado un email a <span className="text-gold">{email}</span> con un enlace para restablecer tu contraseña.
            </p>
            <p className="text-sm text-muted">Revisa también la carpeta de spam.</p>
            <Link
              href="/admin"
              className="text-sm text-muted hover:text-gold transition-colors mt-2"
            >
              ← Volver al login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted text-center mb-6">
              Introduce tu email y te enviaremos un enlace para restablecer la contraseña.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email}
                className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-lg py-3.5 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                href="/admin"
                className="text-sm text-muted hover:text-gold transition-colors"
              >
                ← Volver al login
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

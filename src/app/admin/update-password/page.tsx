'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }

    setLoading(true); setError('')
    const res = await fetch('/api/admin/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    })

    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/admin'), 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al actualizar la contraseña')
      setLoading(false)
    }
  }

  if (!token) {
    return <p className="text-center text-sm" style={{ color: 'var(--danger)' }}>Enlace no válido.</p>
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-lg font-display italic mb-2" style={{ color: 'var(--ok)' }}>✓ Contraseña actualizada</p>
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Redirigiendo al panel...</p>
      </div>
    )
  }

  const INPUT = "w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-colors"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Nueva contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mín. 6 caracteres" autoFocus
          className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Repetir contraseña</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
      </div>
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      <button type="submit" disabled={loading || !password || !confirm}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--primary)', color: '#fff' }}>
        {loading ? 'Guardando...' : 'Guardar contraseña'}
      </button>
    </form>
  )
}

export default function AdminUpdatePasswordPage() {
  return (
    <main className="min-h-screen flex flex-col px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--primary)', boxShadow: 'var(--shadow)' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M6 26 Q6 10 16 8 Q26 10 26 26" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h1 className="font-display italic text-3xl mb-1" style={{ color: 'var(--ink)' }}>Nueva contraseña</h1>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Panel de administración</p>
        </div>
        <Suspense>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </main>
  )
}

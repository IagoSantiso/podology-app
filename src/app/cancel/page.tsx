'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function CancelContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleCancel() {
    if (!id) return
    setState('loading')
    const res = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: id }),
    })
    setState(res.ok ? 'done' : 'error')
  }

  if (!id) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted">Enlace de cancelación inválido.</p>
          <Link href="/book" className="text-gold text-sm mt-4 inline-block">Volver al inicio</Link>
        </div>
      </main>
    )
  }

  if (state === 'done') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-6">🗓️</div>
        <h1 className="font-display text-2xl font-bold text-cream mb-3">Cita cancelada</h1>
        <p className="text-muted mb-8">Tu cita ha sido cancelada correctamente.</p>
        <Link href="/book" className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3 px-8 transition-colors">
          Reservar nueva cita
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl mb-6">⚠️</div>
      <h1 className="font-display text-2xl font-bold text-cream mb-3">¿Cancelar tu cita?</h1>
      <p className="text-muted mb-8">Esta acción no se puede deshacer.</p>

      {state === 'error' && <p className="text-red-400 text-sm mb-4">Error al cancelar. Inténtalo de nuevo.</p>}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleCancel}
          disabled={state === 'loading'}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-50"
        >
          {state === 'loading' ? 'Cancelando...' : 'Sí, cancelar mi cita'}
        </button>
        <Link href="/book" className="border border-border hover:border-gold text-cream rounded-xl py-3.5 text-sm transition-colors">
          No, mantener la cita
        </Link>
      </div>
    </main>
  )
}

export default function CancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  )
}

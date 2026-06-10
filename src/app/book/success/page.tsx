'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Check circle */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'var(--ok-soft)', border: '2px solid var(--ok)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ok)' }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="font-display italic text-4xl mb-3" style={{ color: 'var(--ink)' }}>¡Cita confirmada!</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          Te esperamos. Recibirás un recordatorio antes de la cita.
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <a
            href="https://calendar.google.com/calendar/r/eventedit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Añadir al calendario
          </a>

          <Link
            href="/book"
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)' }}
          >
            Reservar otra cita
          </Link>

          <Link
            href="/book/login"
            className="py-3 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            Crear cuenta para ver tu historial →
          </Link>
        </div>

        {id && (
          <p className="mt-8 text-xs tabular-nums" style={{ color: 'var(--line)' }}>
            Ref: {id.slice(0, 8).toUpperCase()}
          </p>
        )}

      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}

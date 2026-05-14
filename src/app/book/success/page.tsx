'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        {/* Icono animado */}
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-4xl mx-auto mb-8 animate-pulse">
          ✂️
        </div>

        <h1 className="font-display text-4xl font-bold text-gold mb-3">¡Cita confirmada!</h1>
        <p className="text-muted mb-8">
          Te hemos enviado un email con todos los detalles.
          Nos vemos pronto.
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <Link
            href="/book"
            className="block bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3.5 transition-colors"
          >
            Reservar otra cita
          </Link>

          <Link
            href="/book/login"
            className="block border border-border hover:border-gold text-cream rounded-xl py-3.5 transition-colors text-sm"
          >
            Crear cuenta para ver tu historial
          </Link>
        </div>

        {id && (
          <p className="mt-8 text-xs text-border">
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

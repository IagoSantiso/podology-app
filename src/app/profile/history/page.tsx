'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase-client'

interface Visit {
  id: string
  visit_date: string
  podologist_notes: string | null
  services: { name: string; price: number | null } | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/book/login'); return }
      const { data } = await supabase
        .from('visit_history')
        .select('id, visit_date, podologist_notes, services(name, price)')
        .eq('client_user_id', user.id)
        .order('visit_date', { ascending: false })
      setVisits((data as unknown as Visit[]) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <main className="min-h-screen px-5 py-10 max-w-md mx-auto" style={{ background: 'var(--bg)' }}>

      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ink-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Perfil
        </Link>
        <span style={{ color: 'var(--line)' }}>/</span>
        <h1 className="font-display italic text-xl" style={{ color: 'var(--ink)' }}>Mis visitas</h1>
      </div>

      {loading ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--ink-3)' }}>Cargando...</p>
      ) : visits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--ink-3)' }}>Aún no tienes visitas registradas</p>
          <Link href="/book/select" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--primary)' }}>
            Reservar tu primera cita →
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Línea vertical */}
          <div
            className="absolute top-2 bottom-2 left-[7px] w-px"
            style={{ background: 'var(--line)' }}
          />

          <div className="flex flex-col gap-6">
            {visits.map((v, i) => (
              <div key={v.id} className="flex gap-5">
                {/* Dot */}
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 mt-1.5 z-10"
                  style={{ background: i === 0 ? 'var(--primary)' : 'var(--line)', border: `2px solid ${i === 0 ? 'var(--primary)' : 'var(--line-2)'}` }}
                />

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: i === 0 ? 'var(--shadow-sm)' : 'none' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{v.services?.name ?? '—'}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {format(new Date(v.visit_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                    {v.services?.price != null && (
                      <span className="font-semibold text-sm shrink-0" style={{ color: 'var(--primary)' }}>
                        {Number(v.services.price).toFixed(2)} €
                      </span>
                    )}
                  </div>

                  {v.podologist_notes && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
                      <p className="text-xs font-bold tracking-[0.12em] uppercase mb-1" style={{ color: 'var(--ink-3)' }}>
                        Notas de la podóloga
                      </p>
                      <p className="text-sm italic leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                        "{v.podologist_notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

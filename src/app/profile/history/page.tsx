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
  barber_notes: string | null
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
        .select('id, visit_date, barber_notes, services(name, price)')
        .eq('client_user_id', user.id)
        .order('visit_date', { ascending: false })

      setVisits((data as unknown as Visit[]) ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  return (
    <main className="min-h-screen px-4 py-10 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="text-muted hover:text-gold text-sm transition-colors">← Perfil</Link>
        <h1 className="font-display text-2xl font-bold text-cream">Mis visitas</h1>
      </div>

      {loading ? (
        <p className="text-muted text-center py-12">Cargando...</p>
      ) : visits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-4">Aún no tienes visitas registradas</p>
          <Link href="/book/select" className="text-gold hover:underline text-sm">Reservar tu primera cita →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visits.map(v => (
            <div key={v.id} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-cream font-semibold">{v.services?.name ?? '—'}</p>
                  <p className="text-muted text-sm capitalize">
                    {format(new Date(v.visit_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                {v.services?.price && (
                  <span className="text-gold font-semibold text-sm">{Number(v.services.price).toFixed(2)} €</span>
                )}
              </div>
              {v.barber_notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted uppercase tracking-widest mb-1">Notas del barbero</p>
                  <p className="text-cream text-sm italic">"{v.barber_notes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase-client'

interface Service { id: string; name: string }
interface Profile {
  full_name: string
  phone: string
  preferred_service_id: string | null
  notes_for_barber: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '', preferred_service_id: null, notes_for_barber: '' })
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createSupabaseClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/book/login'); return }
      setEmail(user.email ?? '')

      const [{ data: prof }, { data: svcs }] = await Promise.all([
        supabase.from('client_profiles').select('*').eq('id', user.id).single(),
        supabase.from('services').select('id, name').eq('is_active', true),
      ])

      if (prof) {
        setProfile({
          full_name: prof.full_name ?? '',
          phone: prof.phone ?? '',
          preferred_service_id: prof.preferred_service_id ?? null,
          notes_for_barber: prof.notes_for_barber ?? '',
        })
      }
      setServices(svcs ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  async function save() {
    const supabase = createSupabaseClient()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('client_profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      preferred_service_id: profile.preferred_service_id || null,
      notes_for_barber: profile.notes_for_barber,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function logout() {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push('/book')
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center"><p className="text-muted">Cargando...</p></main>
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Mi perfil</h1>
          <p className="text-muted text-sm mt-0.5">{email}</p>
        </div>
        <button onClick={logout} className="text-sm text-muted hover:text-red-400 transition-colors">Salir</button>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-muted mb-1.5">Nombre completo</label>
          <input
            value={profile.full_name}
            onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Tu nombre"
            className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1.5">Teléfono</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            placeholder="+34 600 000 000"
            className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1.5">Servicio preferido</label>
          <select
            value={profile.preferred_service_id ?? ''}
            onChange={e => setProfile(p => ({ ...p, preferred_service_id: e.target.value || null }))}
            className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream focus:outline-none focus:border-gold"
          >
            <option value="">Sin preferencia</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1.5">Notas para el barbero</label>
          <textarea
            value={profile.notes_for_barber}
            onChange={e => setProfile(p => ({ ...p, notes_for_barber: e.target.value }))}
            placeholder="Ej: Corte muy corto a los lados, largo arriba, sin navaja..."
            rows={3}
            className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold resize-none text-sm"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-50"
        >
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar perfil'}
        </button>

        <Link
          href="/profile/history"
          className="block text-center border border-border hover:border-gold text-cream rounded-xl py-3.5 text-sm transition-colors"
        >
          Ver historial de visitas →
        </Link>

        <Link
          href="/book/select"
          className="block text-center text-gold hover:underline text-sm mt-2"
        >
          Reservar nueva cita
        </Link>
      </div>
    </main>
  )
}

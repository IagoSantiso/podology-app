'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase-client'

interface Service { id: string; name: string }
interface Profile {
  full_name: string; phone: string
  preferred_service_id: string | null; notes_for_podologist: string
}
interface NextAppointment {
  id: string; appointment_date: string; start_time: string
  services: { name: string } | null
}
interface PastAppointment {
  id: string; appointment_date: string; start_time: string
  services: { name: string; price: number | null } | null
}

const INPUT = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '', preferred_service_id: null, notes_for_podologist: '' })
  const [services, setServices] = useState<Service[]>([])
  const [nextApt, setNextApt] = useState<NextAppointment | null>(null)
  const [pastApts, setPastApts] = useState<PastAppointment[]>([])
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

      const today = new Date().toISOString().slice(0, 10)
      const [{ data: prof }, { data: svcs }, { data: apts }, { data: past }] = await Promise.all([
        supabase.from('client_profiles').select('*').eq('id', user.id).single(),
        supabase.from('services').select('id, name').eq('is_active', true),
        supabase.from('appointments')
          .select('id, appointment_date, start_time, services(name)')
          .eq('client_user_id', user.id)
          .eq('status', 'confirmed')
          .gte('appointment_date', today)
          .order('appointment_date').order('start_time')
          .limit(1),
        supabase.from('appointments')
          .select('id, appointment_date, start_time, services(name, price)')
          .eq('client_user_id', user.id)
          .in('status', ['confirmed', 'completed'])
          .lt('appointment_date', today)
          .order('appointment_date', { ascending: false })
          .limit(5),
      ])

      if (prof) {
        setProfile({
          full_name: prof.full_name ?? '', phone: prof.phone ?? '',
          preferred_service_id: prof.preferred_service_id ?? null,
          notes_for_podologist: prof.notes_for_podologist ?? '',
        })
      }
      setServices(svcs ?? [])
      setNextApt((apts?.[0] as unknown as NextAppointment) ?? null)
      setPastApts((past as unknown as PastAppointment[]) ?? [])
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
      id: user.id, full_name: profile.full_name, phone: profile.phone,
      preferred_service_id: profile.preferred_service_id || null,
      notes_for_podologist: profile.notes_for_podologist,
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function logout() {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push('/book')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--ink-3)' }}>Cargando...</p>
      </main>
    )
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen px-5 py-10 max-w-md mx-auto" style={{ background: 'var(--bg)' }}>

      {/* Header con avatar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>{profile.full_name || 'Mi perfil'}</p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{email}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--danger)' }}>Salir</button>
      </div>

      {/* Próxima cita */}
      {nextApt && (
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}
        >
          <p className="text-xs font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--primary)' }}>Próxima cita</p>
          <p className="font-semibold" style={{ color: 'var(--primary-deep)' }}>{nextApt.services?.name ?? '—'}</p>
          <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--primary)' }}>
            {format(new Date(nextApt.appointment_date + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })} · {nextApt.start_time.slice(0, 5)}h
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              href={`/reschedule?id=${nextApt.id}`}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-opacity hover:opacity-80"
              style={{ background: 'var(--card)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
            >
              Reprogramar
            </Link>
            <Link
              href={`/cancel?id=${nextApt.id}`}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-opacity hover:opacity-80"
              style={{ background: 'var(--card)', color: 'var(--danger)', border: '1px solid var(--line)' }}
            >
              Cancelar
            </Link>
          </div>
        </div>
      )}

      {/* Formulario de datos */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Nombre completo</label>
          <input
            value={profile.full_name}
            onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Tu nombre"
            className={INPUT}
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Teléfono</label>
          <input
            type="tel" value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            placeholder="+34 600 000 000"
            className={INPUT}
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Servicio preferido</label>
          <select
            value={profile.preferred_service_id ?? ''}
            onChange={e => setProfile(p => ({ ...p, preferred_service_id: e.target.value || null }))}
            className={INPUT}
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >
            <option value="">Sin preferencia</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>Notas para la podóloga</label>
          <textarea
            value={profile.notes_for_podologist}
            onChange={e => setProfile(p => ({ ...p, notes_for_podologist: e.target.value }))}
            placeholder="Ej: Uña encarnada pie derecho, sensibilidad en talón..."
            rows={3}
            className={`${INPUT} resize-none`}
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <button
          onClick={save} disabled={saving}
          className="py-3.5 rounded-2xl font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar perfil'}
        </button>

        {/* Historial de citas */}
        <div>
          <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--primary)' }}>Historial de citas</p>
          {pastApts.length === 0 ? (
            <p className="text-sm py-2" style={{ color: 'var(--ink-3)' }}>No tienes citas anteriores registradas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pastApts.map(apt => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
                >
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{apt.services?.name ?? '—'}</p>
                    <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {format(new Date(apt.appointment_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })} · {apt.start_time.slice(0, 5)}h
                    </p>
                  </div>
                  {apt.services?.price != null && (
                    <span className="text-sm font-semibold shrink-0 ml-3" style={{ color: 'var(--ink-3)' }}>
                      {Number(apt.services.price).toFixed(2)} €
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/bonos"
          className="flex items-center justify-between rounded-2xl p-4 transition-all hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-soft)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ink)' }}>Comprar un bono</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>Ahorra con nuestros bonos de sesiones</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>

        <Link
          href="/profile/history"
          className="flex items-center justify-between py-4 px-5 rounded-2xl font-medium text-sm transition-opacity hover:opacity-80"
          style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
        >
          Ver notas de la podóloga
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        <Link href="/book/select" className="text-center text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--primary)' }}>
          Reservar nueva cita →
        </Link>
      </div>

    </main>
  )
}

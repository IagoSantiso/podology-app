import Link from 'next/link'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getPublicConfig() {
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase
      .from('podologist_config')
      .select('business_name, logo_url')
      .eq('id', 1)
      .single()
    return { business_name: data?.business_name ?? 'Patricia Podología', logo_url: data?.logo_url ?? null }
  } catch {
    return { business_name: 'Patricia Podología', logo_url: null }
  }
}

export default async function BookPage() {
  const { business_name, logo_url } = await getPublicConfig()
  const [firstName, ...rest] = business_name.split(' ')
  const lastName = rest.join(' ')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        {/* BrandMark */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 overflow-hidden"
          style={{ background: 'var(--primary)', boxShadow: 'var(--shadow)' }}
        >
          {logo_url
            ? <img src={logo_url} alt={business_name} className="w-full h-full object-cover" />
            : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 26 Q6 10 16 8 Q26 10 26 26" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              </svg>
            )
          }
        </div>

        {/* Wordmark */}
        <div className="mb-1">
          <span className="font-display italic text-2xl" style={{ color: 'var(--ink)' }}>{firstName}</span>
          {lastName && (
            <span
              className="font-sans font-bold text-xs tracking-[0.2em] uppercase ml-2"
              style={{ color: 'var(--ink-2)' }}
            >
              {lastName}
            </span>
          )}
        </div>

        <p className="text-sm mb-10" style={{ color: 'var(--ink-3)' }}>
          Reserva tu cita online en segundos
        </p>

        {/* CTA principal */}
        <Link
          href="/book/login"
          className="w-full flex items-center justify-center gap-2 font-semibold text-base py-4 rounded-2xl transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
        >
          Pedir cita
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>

        {/* Accesos secundarios */}
        <div className="flex items-center gap-6 mt-8">
          <Link href="/bonos" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--primary)' }}>
            Mis bonos
          </Link>
          <span style={{ color: 'var(--line)' }}>·</span>
          <Link href="/profile" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--primary)' }}>
            Mi cuenta
          </Link>
        </div>

      </div>
    </main>
  )
}

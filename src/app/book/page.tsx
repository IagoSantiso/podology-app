import Link from 'next/link'
import { createSupabaseAdmin } from '@/lib/supabase-server'

async function getPublicConfig() {
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase
      .from('barber_config')
      .select('business_name, logo_url')
      .eq('id', 1)
      .single()
    return { business_name: data?.business_name ?? 'BarberApp', logo_url: data?.logo_url ?? null }
  } catch {
    return { business_name: 'BarberApp', logo_url: null }
  }
}

export default async function BookPage() {
  const { business_name, logo_url } = await getPublicConfig()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / nombre */}
      <div className="text-center mb-12">
        {logo_url ? (
          <img src={logo_url} alt={business_name} className="w-20 h-20 object-contain mx-auto mb-3 rounded-xl" />
        ) : (
          <span className="text-4xl block mb-3">✂️</span>
        )}
        <h1 className="font-display text-4xl font-bold text-gold tracking-wide">{business_name}</h1>
        <p className="text-muted mt-2 text-sm">Elige cómo quieres continuar</p>
      </div>

      {/* Opciones */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link href="/book/guest"
          className="group block bg-bg-card border border-border rounded-xl p-6 hover:border-gold transition-colors duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-2xl shrink-0">⚡</div>
            <div>
              <p className="font-semibold text-cream text-lg leading-tight">Continuar como invitado</p>
              <p className="text-muted text-sm mt-0.5">Rápido, sin necesidad de cuenta</p>
            </div>
          </div>
        </Link>

        <Link href="/book/login"
          className="group block bg-bg-card border border-border rounded-xl p-6 hover:border-gold transition-colors duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-2xl shrink-0">👤</div>
            <div>
              <p className="font-semibold text-cream text-lg leading-tight">Iniciar sesión</p>
              <p className="text-muted text-sm mt-0.5">Accede a tu historial de cortes</p>
            </div>
          </div>
        </Link>

        <div className="text-center mt-2">
          <Link href="/book/login?register=1" className="text-sm text-muted hover:text-gold transition-colors">
            ¿Primera vez? <span className="text-gold underline">Crear cuenta</span>
          </Link>
        </div>
      </div>
    </main>
  )
}

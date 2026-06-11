'use client'

import { useRouter } from 'next/navigation'
import BrandHeader from '@/components/admin/BrandHeader'

const steps: { browser: string; icon: string; steps: string[] }[] = [
  {
    browser: 'Chrome (escritorio)',
    icon: '🟡',
    steps: [
      'Haz clic en el candado 🔒 a la izquierda de la barra de dirección.',
      'Selecciona "Configuración del sitio".',
      'Busca "Notificaciones" y cambia el valor a "Permitir".',
    ],
  },
  {
    browser: 'Chrome (Android)',
    icon: '🤖',
    steps: [
      'Toca los tres puntos ⋮ en la esquina superior derecha.',
      'Ve a Configuración → Configuración del sitio → Notificaciones.',
      'Activa el permiso para esta web.',
    ],
  },
  {
    browser: 'Safari (iPhone / iPad)',
    icon: '🍎',
    steps: [
      'Abre los Ajustes del sistema y baja hasta Safari.',
      'Toca "Configuración de sitios web" → "Notificaciones".',
      'Busca este sitio y cambia a "Permitir".',
    ],
  },
  {
    browser: 'Safari (Mac)',
    icon: '🖥️',
    steps: [
      'En el menú Safari ve a "Preferencias" → pestaña "Sitios web".',
      'Selecciona "Notificaciones" en la columna izquierda.',
      'Localiza este sitio y elige "Permitir".',
    ],
  },
  {
    browser: 'Firefox',
    icon: '🦊',
    steps: [
      'Haz clic en el icono de información ℹ️ junto a la barra de dirección.',
      'Haz clic en "Más información" → pestaña "Permisos".',
      'Busca "Mostrar notificaciones" y desmarca "Usar por defecto".',
      'Selecciona "Permitir".',
    ],
  },
  {
    browser: 'Edge',
    icon: '🔵',
    steps: [
      'Haz clic en el candado 🔒 junto a la barra de dirección.',
      'Selecciona "Permisos para este sitio".',
      'Cambia "Notificaciones" a "Permitir".',
    ],
  },
]

export default function NotificacionesTutorialPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto" style={{ background: 'var(--bg)' }}>
      <BrandHeader section="Ajustes" />

      <div className="px-5 pt-5 mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-3)' }}
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="font-display italic text-[28px] leading-none" style={{ color: 'var(--ink)' }}>
          Notificaciones
        </h1>
      </div>

      <div className="px-5 flex flex-col gap-5">

        <div className="p-4 rounded-2xl" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Las notificaciones push dependen del permiso que concedas en tu navegador. A continuación te explicamos cómo activarlas según el dispositivo que uses.
          </p>
        </div>

        {steps.map(({ browser, icon, steps: list }) => (
          <div key={browser} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--field)' }}>
              <span className="text-base">{icon}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{browser}</span>
            </div>
            <ol className="px-4 py-3 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
              {list.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}

        <p className="text-xs text-center font-display italic pb-4" style={{ color: 'var(--ink-3)' }}>
          Para desactivarlas, sigue los mismos pasos y selecciona "Bloquear" o "Denegar".
        </p>

      </div>
    </main>
  )
}

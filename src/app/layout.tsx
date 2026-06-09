import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Podología — Reserva tu cita',
  description: 'Reserva tu cita online en segundos.',
  applicationName: 'Podology-app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Podology-app',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-cream antialiased">
        {children}
        <footer className="text-center text-xs text-gray-600 py-4">
          <a href="/privacidad" className="hover:text-amber-500 mr-4">Privacidad</a>
          <a href="/aviso-legal" className="hover:text-amber-500">Aviso legal</a>
        </footer>
      </body>
    </html>
  )
}

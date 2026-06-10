import type { Metadata } from 'next'
import { Newsreader, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Patricia Podología — Reserva tu cita',
  description: 'Reserva tu cita online en segundos.',
  applicationName: 'Patricia Podología',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Patricia Podología',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${newsreader.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-ink antialiased">
        {children}
        <footer className="text-center text-xs text-ink-3 py-4">
          <a href="/privacidad" className="hover:text-primary mr-4">Privacidad</a>
          <a href="/aviso-legal" className="hover:text-primary">Aviso legal</a>
        </footer>
      </body>
    </html>
  )
}

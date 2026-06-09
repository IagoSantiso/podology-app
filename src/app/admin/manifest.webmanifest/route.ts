import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    name: 'Podology Admin',
    short_name: 'Admin',
    description: 'Panel de administración de la podología.',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  })
}

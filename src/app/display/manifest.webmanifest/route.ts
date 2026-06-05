import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    name: 'Barber Display',
    short_name: 'Display',
    description: 'Pantalla de turno de la barbería.',
    start_url: '/display',
    display: 'fullscreen',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  })
}

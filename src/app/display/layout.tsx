import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Podology Display',
  manifest: '/display/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Display',
  },
}

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

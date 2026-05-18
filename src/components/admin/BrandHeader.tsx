'use client'

import { useEffect, useState } from 'react'

interface BrandConfig { business_name: string; logo_url: string | null }

let cached: BrandConfig | null = null

export default function BrandHeader({ section }: { section: string }) {
  const [brand, setBrand] = useState<BrandConfig | null>(cached)

  useEffect(() => {
    if (cached) return
    fetch('/api/public/config')
      .then(r => r.json())
      .then(d => {
        cached = { business_name: d.business_name ?? 'BarberApp', logo_url: d.logo_url ?? null }
        setBrand(cached)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex items-center gap-2.5 px-5 pt-3.5">
      <span className="w-[26px] h-[26px] rounded-sm border border-gold/35 inline-flex items-center justify-center text-gold overflow-hidden shrink-0">
        {brand?.logo_url
          ? <img src={brand.logo_url} alt="" className="w-full h-full object-cover"/>
          : <Scissors className="w-3 h-3"/>
        }
      </span>
      <div className="leading-none">
        <div className="font-display italic text-[14px] text-cream">
          {brand?.business_name ?? <span className="opacity-0">·</span>}
        </div>
        <div className="text-[9px] tracking-[0.22em] uppercase text-muted mt-0.5 font-semibold">{section}</div>
      </div>
    </div>
  )
}

function Scissors({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  )
}
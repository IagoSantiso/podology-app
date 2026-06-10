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
        cached = { business_name: d.business_name ?? 'Patricia Podología', logo_url: d.logo_url ?? null }
        setBrand(cached)
      })
      .catch(() => {})
  }, [])

  const name = brand?.business_name ?? 'Patricia Podología'
  const [firstName, ...rest] = name.split(' ')
  const lastName = rest.join(' ')

  return (
    <div className="flex items-center gap-3 px-5 pt-4">
      <span
        className="w-8 h-8 rounded-[10px] shrink-0 overflow-hidden inline-flex items-center justify-center"
        style={{ background: 'var(--primary)' }}
      >
        {brand?.logo_url
          ? <img src={brand.logo_url} alt="" className="w-full h-full object-cover" />
          : <FootArchMark />
        }
      </span>
      <div className="leading-none">
        <div className="leading-tight" style={{ color: 'var(--ink)' }}>
          <span className="font-display italic text-[15px]">{firstName}</span>
          {lastName && (
            <span className="font-sans font-semibold text-[11px] tracking-[0.12em] uppercase ml-1.5" style={{ color: 'var(--ink-2)' }}>
              {lastName}
            </span>
          )}
        </div>
        <div
          className="text-[9px] tracking-[0.22em] uppercase font-bold mt-0.5"
          style={{ color: 'var(--primary)' }}
        >
          {section}
        </div>
      </div>
    </div>
  )
}

function FootArchMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 14 Q3 6 9 5 Q15 6 15 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

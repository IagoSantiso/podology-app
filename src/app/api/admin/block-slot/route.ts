import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdmin()

  const { error } = await supabase.from('blocked_slots').insert({
    blocked_date: body.blocked_date,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    reason: body.reason ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

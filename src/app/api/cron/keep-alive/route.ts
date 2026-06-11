import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

// Fired every 48 h by Vercel Cron to prevent Supabase from pausing the project.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseAdmin()

  const { error } = await supabase
    .from('podologist_config')
    .select('id')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[keep-alive] Supabase ping failed:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
}

import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'ENV_MISSING', url: !!url, key: !!key }, { status: 500 })
  }

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    return NextResponse.json({ services: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e), cause: String(e?.cause ?? '') }, { status: 500 })
  }
}

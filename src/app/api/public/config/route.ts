import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('podologist_config')
    .select('business_name, logo_url, business_address')
    .eq('id', 1)
    .single()

  return NextResponse.json({
    business_name: data?.business_name ?? 'PodologyApp',
    logo_url: data?.logo_url ?? null,
    business_address: data?.business_address ?? '',
  })
}

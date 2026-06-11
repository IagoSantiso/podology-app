import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/book/select'

  if (code) {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user) {
      const { id, user_metadata } = data.user
      const fullName = user_metadata?.full_name as string | undefined
      const phone = user_metadata?.phone as string | undefined
      if (fullName || phone) {
        const admin = createSupabaseAdmin()
        await admin.from('client_profiles').upsert(
          { id, full_name: fullName ?? null, phone: phone ?? null },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/book/login?error=auth`)
}

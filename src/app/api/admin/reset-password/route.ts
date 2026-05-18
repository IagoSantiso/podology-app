import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Introduce tu email' }, { status: 400 })
  }

  const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin
  const redirectTo = `${origin}/auth/callback?next=/admin/update-password`

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

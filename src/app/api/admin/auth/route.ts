import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const supabase = createSupabaseAdmin()

  // Check DB password first, fall back to env var
  const { data: config } = await supabase
    .from('barber_config')
    .select('admin_password')
    .eq('id', 1)
    .single()

  const validPassword = config?.admin_password || process.env.ADMIN_PASSWORD

  if (!validPassword || password !== validPassword) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_session')
  return res
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Introduce email y contraseña' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (email.trim() !== adminEmail) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  // Leer contraseña actual desde la DB; si aún no se ha configurado, usar env var como fallback
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('podologist_config')
    .select('admin_password')
    .eq('id', 1)
    .single()

  const validPassword = data?.admin_password ?? process.env.ADMIN_PASSWORD

  if (!validPassword || password !== validPassword) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_session')
  return res
}
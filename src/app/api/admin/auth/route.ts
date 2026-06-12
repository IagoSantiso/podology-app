import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { hashPassword, verifyPassword } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Introduce email y contraseña' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || email.trim() !== adminEmail) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('podologist_config')
    .select('admin_password')
    .eq('id', 1)
    .single()

  const stored = data?.admin_password as string | null
  let authenticated = false

  if (stored && stored.includes(':')) {
    // Contraseña hasheada con scrypt (formato salt:hash)
    authenticated = await verifyPassword(password, stored)
  } else {
    // Sin hash aún: comparar con env var y hashear para futuros logins
    const envPassword = process.env.ADMIN_PASSWORD
    const match = (envPassword && password === envPassword) || (stored && password === stored)
    if (match) {
      authenticated = true
      const hash = await hashPassword(password)
      await supabase.from('podologist_config').update({ admin_password: hash }).eq('id', 1)
    }
  }

  if (!authenticated) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_session')
  return res
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const loginEmail = email?.trim() || process.env.ADMIN_EMAIL

  if (!loginEmail) {
    return NextResponse.json({ error: 'Introduce tu email' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Introduce tu contraseña' }, { status: 400 })
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })

  if (error) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
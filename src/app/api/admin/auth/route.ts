import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL no configurado' }, { status: 500 })
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password })

  if (error) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
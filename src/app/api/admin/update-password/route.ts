import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { hashPassword, verifyResetToken } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (!token || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const result = verifyResetToken(token)
  if (!result.valid) {
    return NextResponse.json({ error: 'El enlace ha expirado o no es válido' }, { status: 401 })
  }

  const hash = await hashPassword(newPassword)
  const supabase = createSupabaseAdmin()
  await supabase.from('podologist_config').update({ admin_password: hash }).eq('id', 1)

  return NextResponse.json({ ok: true })
}

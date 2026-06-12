import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { hashPassword, verifyPassword } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('podologist_config')
    .select('admin_password')
    .eq('id', 1)
    .single()

  const stored = data?.admin_password as string | null
  let currentValid = false

  if (stored && stored.includes(':')) {
    currentValid = await verifyPassword(currentPassword, stored)
  } else if (stored) {
    currentValid = currentPassword === stored
  } else {
    const envPassword = process.env.ADMIN_PASSWORD
    currentValid = !!envPassword && currentPassword === envPassword
  }

  if (!currentValid) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 })
  }

  const newHash = await hashPassword(newPassword)
  await supabase.from('podologist_config').update({ admin_password: newHash }).eq('id', 1)

  return NextResponse.json({ ok: true })
}

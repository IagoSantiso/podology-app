import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password, fullName, phone } = await req.json()

  if (!email || !password || !fullName || !phone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  })

  if (error) {
    const msg = error.message.toLowerCase().includes('already registered')
      || error.message.toLowerCase().includes('already been registered')
      || error.message.toLowerCase().includes('user already exists')
      ? 'Ya existe una cuenta con ese email.'
      : 'No se pudo crear la cuenta. Inténtalo de nuevo.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (data.user) {
    await admin.from('client_profiles').upsert(
      { id: data.user.id, full_name: fullName, phone },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  return NextResponse.json({ success: true })
}

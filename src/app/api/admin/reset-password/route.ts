import { NextRequest, NextResponse } from 'next/server'
import { createResetToken } from '@/lib/admin-auth'
import { sendPasswordResetEmail } from '@/lib/brevo'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Introduce tu email' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  // Siempre devolver OK para no revelar si el email existe
  if (!adminEmail || email.trim() !== adminEmail) {
    return NextResponse.json({ ok: true })
  }

  try {
    const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin
    const token = createResetToken(email.trim())
    const resetUrl = `${origin}/admin/update-password?token=${token}`
    await sendPasswordResetEmail({ email: email.trim(), resetUrl })
  } catch (e) {
    console.error('Error enviando email de reset:', e)
  }

  return NextResponse.json({ ok: true })
}

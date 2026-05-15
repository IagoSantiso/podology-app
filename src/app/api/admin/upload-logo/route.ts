import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'png'
  const fileName = `logo-${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const supabase = createSupabaseAdmin()

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)

  await supabase.from('barber_config').update({ logo_url: publicUrl }).eq('id', 1)

  return NextResponse.json({ url: publicUrl })
}

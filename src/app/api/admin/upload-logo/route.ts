import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

const BUCKET = 'assets'

async function ensureBucket(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some(b => b.name === BUCKET)) return
  await supabase.storage.createBucket(BUCKET, { public: true })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

  const fileName = `logo-${Date.now()}.jpg`
  const bytes = await file.arrayBuffer()

  const supabase = createSupabaseAdmin()

  await ensureBucket(supabase)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  await supabase.from('barber_config').update({ logo_url: publicUrl }).eq('id', 1)

  return NextResponse.json({ url: publicUrl })
}

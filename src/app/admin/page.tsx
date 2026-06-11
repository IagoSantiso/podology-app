import { createSupabaseAdmin } from '@/lib/supabase-server'
import AdminLoginForm from './AdminLoginForm'

export const dynamic = 'force-dynamic'

async function getPodologistFirstName(): Promise<string> {
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase
      .from('podologist_config')
      .select('business_name')
      .eq('id', 1)
      .single()
    const full = data?.business_name ?? 'Patricia'
    return full.split(' ')[0]
  } catch {
    return 'Patricia'
  }
}

export default async function AdminLoginPage() {
  const name = await getPodologistFirstName()
  return <AdminLoginForm name={name} />
}

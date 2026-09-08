// Notificações enviadas pelo Convecta Super Admin para este painel
import { supabase } from '@/lib/supabase'

async function getBusinessId() {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null
  const { data } = await supabase
    .from('users').select('business_id').eq('id', authData.user.id).maybeSingle()
  return data?.business_id || null
}

export async function listConvectaNotifs() {
  const bid = await getBusinessId()
  if (!bid) return []
  const { data, error } = await supabase
    .from('business_notifications')
    .select('*')
    .eq('business_id', bid)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data || []
}

export async function markConvectaNotifRead(id) {
  await supabase.from('business_notifications').update({ read: true }).eq('id', id)
}

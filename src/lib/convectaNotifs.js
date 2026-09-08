// Notificações enviadas pelo Convecta Super Admin para este painel
import { supabase } from '@/lib/supabase'

export async function listConvectaNotifs() {
  const { data, error } = await supabase
    .from('business_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data || []
}

export async function markConvectaNotifRead(id) {
  await supabase.from('business_notifications').update({ read: true }).eq('id', id)
}

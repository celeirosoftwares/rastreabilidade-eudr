import { createClient } from '@/lib/supabase/client'

export async function checkSubscription(): Promise<boolean> {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user?.organization_id) return false

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, subscription_ends_at')
    .eq('id', user.organization_id)
    .single()

  if (!org) return false

  const status = org.subscription_status
  const endsAt = org.subscription_ends_at

  return (
    status === 'active' ||
    (status === 'canceling' && endsAt && new Date(endsAt) > new Date())
  )
}

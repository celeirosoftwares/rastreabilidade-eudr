'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function verifySubscription() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const { data: user } = await supabase
    .from('users').select('organization_id').eq('id', session.user.id).single()
  if (!user?.organization_id) throw new Error('Organização não encontrada')

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, subscription_ends_at')
    .eq('id', user.organization_id)
    .single()

  const status = org?.subscription_status
  const endsAt = org?.subscription_ends_at
  const hasAccess =
    status === 'active' ||
    (status === 'canceling' && endsAt && new Date(endsAt) > new Date())

  if (!hasAccess) throw new Error('Assinatura necessária')
  return supabase
}

export async function getAreas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('areas')
    .select('*, property:properties(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getArea(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('areas')
    .select('*, property:properties(name)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createArea(data: {
  name: string
  property_id: string
  geojson: any
  size_hectares: number
  land_use: string
}) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('areas').insert({
    name: data.name,
    property_id: data.property_id,
    geojson: data.geojson,
    size_hectares: data.size_hectares,
    land_use: data.land_use,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/areas')
  redirect('/dashboard/areas')
}

export async function deleteArea(id: string) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('areas').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/areas')
}

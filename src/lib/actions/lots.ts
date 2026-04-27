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

export async function getLots() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lots')
    .select('*, property:properties(name), area:areas(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getLot(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lots')
    .select('*, property:properties(*), area:areas(*), events(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createLot(data: {
  property_id: string
  area_id?: string
  crop_type: string
  harvest_year?: number
  metadata?: any
}) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('lots').insert({
    property_id: data.property_id,
    area_id: data.area_id || null,
    crop_type: data.crop_type,
    harvest_year: data.harvest_year || null,
    metadata: data.metadata || {},
    status: 'active',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/lots')
  redirect('/dashboard/lots')
}

export async function updateLot(id: string, data: any) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('lots').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/lots')
}

export async function deleteLot(id: string) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('lots').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/lots')
}

export async function createEvent(data: {
  lot_id: string
  type: string
  description?: string
  date: string
  metadata?: any
}) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('events').insert({
    lot_id: data.lot_id,
    type: data.type,
    description: data.description || null,
    date: data.date,
    metadata: data.metadata || {},
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/lots')
}

export async function getLotById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lots')
    .select('*, property:properties(*), area:areas(*), events(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

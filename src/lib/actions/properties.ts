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

export async function getProperties() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProperty(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*, areas(*), lots(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProperty(formData: FormData) {
  const supabase = await verifySubscription()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: user } = await supabase
    .from('users').select('organization_id').eq('id', session!.user.id).single()

  const { error } = await supabase.from('properties').insert({
    organization_id: user!.organization_id,
    name: formData.get('name') as string,
    owner_name: formData.get('owner_name') as string,
    document_id: formData.get('document_id') as string,
    car_number: formData.get('car_number') as string || null,
    state: formData.get('state') as string || null,
    municipality: formData.get('municipality') as string || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('properties').update({
    name: formData.get('name') as string,
    owner_name: formData.get('owner_name') as string,
    document_id: formData.get('document_id') as string,
    car_number: formData.get('car_number') as string || null,
    state: formData.get('state') as string || null,
    municipality: formData.get('municipality') as string || null,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export async function deleteProperty(id: string) {
  const supabase = await verifySubscription()
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/properties')
}

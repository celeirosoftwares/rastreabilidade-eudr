'use server'
// src/lib/actions/properties.ts

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { PropertyFormData, Property } from '@/types'

function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getProperties(): Promise<Property[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('properties')
    .select('*, areas(id, name, size_hectares), lots(id, crop_type, status)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('properties')
    .select('*, areas(*), lots(*, events(*))')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function createProperty(formData: PropertyFormData) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!userData?.organization_id) throw new Error('Organização não encontrada')

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...formData, organization_id: userData.organization_id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/properties')
  return data
}

export async function updateProperty(id: string, formData: Partial<PropertyFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .update(formData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/properties')
  return data
}

export async function deleteProperty(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/properties')
}

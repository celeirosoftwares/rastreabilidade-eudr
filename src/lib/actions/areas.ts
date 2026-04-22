'use server'
// src/lib/actions/areas.ts

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AreaFormData, Area } from '@/types'

export async function getAreas(propertyId?: string): Promise<Area[]> {
  const supabase = createClient()

  let query = supabase
    .from('areas')
    .select('*, property:properties(name)')
    .order('created_at', { ascending: false })

  if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAreaById(id: string): Promise<Area | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas')
    .select('*, property:properties(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createArea(formData: AreaFormData) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas')
    .insert(formData)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/areas')
  revalidatePath(`/dashboard/properties/${formData.property_id}`)
  return data
}

export async function updateArea(id: string, formData: Partial<AreaFormData>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/areas')
  revalidatePath(`/dashboard/areas/${id}`)
  return data
}

export async function deleteArea(id: string, propertyId: string) {
  const supabase = createClient()

  const { error } = await supabase.from('areas').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/areas')
  revalidatePath(`/dashboard/properties/${propertyId}`)
}

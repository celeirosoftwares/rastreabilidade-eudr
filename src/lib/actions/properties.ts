'use server'
// src/lib/actions/properties.ts

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PropertyFormData, Property } from '@/types'

// Buscar todas as propriedades da organização
export async function getProperties(): Promise<Property[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*, areas(id, name, size_hectares), lots(id, crop_type, status)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Buscar propriedade por ID
export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*, areas(*), lots(*, events(*))')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// Criar nova propriedade
export async function createProperty(formData: PropertyFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('Usuário não encontrado')

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...formData,
      organization_id: userData.organization_id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/properties')
  return data
}

// Atualizar propriedade
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
  revalidatePath(`/dashboard/properties/${id}`)
  return data
}

// Deletar propriedade
export async function deleteProperty(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/properties')
}

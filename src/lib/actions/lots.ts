'use server'
// src/lib/actions/lots.ts

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LotFormData, EventFormData, Lot } from '@/types'

// -------- LOTES --------

export async function getLots(propertyId?: string): Promise<Lot[]> {
  const supabase = createClient()

  let query = supabase
    .from('lots')
    .select('*, property:properties(name, owner_name), area:areas(name, size_hectares), events(*)')
    .order('created_at', { ascending: false })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getLotById(id: string): Promise<Lot | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lots')
    .select('*, property:properties(*), area:areas(*), events(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createLot(formData: LotFormData) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lots')
    .insert(formData)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/lots')
  revalidatePath(`/dashboard/properties/${formData.property_id}`)
  return data
}

export async function updateLot(id: string, formData: Partial<LotFormData>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lots')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/lots')
  revalidatePath(`/dashboard/lots/${id}`)
  return data
}

export async function deleteLot(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('lots')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/lots')
}

// -------- EVENTOS --------

export async function createEvent(formData: EventFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('events')
    .insert({ ...formData, created_by: user?.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/lots/${formData.lot_id}`)

  // Hook preparado para webhook n8n
  await triggerWebhook('event.created', 'event', data.id, data)

  return data
}

export async function deleteEvent(id: string, lotId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/lots/${lotId}`)
}

// -------- WEBHOOK HOOK (n8n / futuro) --------
async function triggerWebhook(
  event: string,
  entityType: string,
  entityId: string,
  data: Record<string, unknown>
) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return // Silencioso se não configurado

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({
        event,
        entity_type: entityType,
        entity_id: entityId,
        data,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (err) {
    // Não bloqueia a operação principal em caso de falha no webhook
    console.error('[Webhook] Falha ao disparar:', err)
  }
}

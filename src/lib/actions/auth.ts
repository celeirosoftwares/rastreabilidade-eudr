'use server'
// src/lib/actions/auth.ts

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-mail ou senha inválidos.' }
  }

  redirect('/dashboard')
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  organizationName: string
) {
  const supabase = createClient()

  // 1. Criar usuário na Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Erro ao criar conta.' }
  }

  // 2. Criar organização
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: organizationName })
    .select()
    .single()

  if (orgError || !org) {
    return { error: 'Erro ao criar organização.' }
  }

  // 3. Criar perfil do usuário vinculado à organização
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    organization_id: org.id,
    name,
    email,
    role: 'owner',
  })

  if (userError) {
    return { error: 'Erro ao criar perfil do usuário.' }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  return profile
}

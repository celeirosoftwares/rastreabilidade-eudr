import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: user } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', session.user.id)
    .single()

  const customerId = user?.organization?.stripe_customer_id
  if (!customerId) return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 })

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}

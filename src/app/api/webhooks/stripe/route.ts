import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature inválida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const orgId = subscription.metadata.organization_id
        await supabaseAdmin.from('organizations').update({
          stripe_subscription_id: subscription.id,
          subscription_status: 'active',
          subscription_ends_at: null,
        }).eq('id', orgId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata.organization_id
        if (!orgId) break
        const isActive = subscription.status === 'active'
        const cancelAtPeriodEnd = subscription.cancel_at_period_end
        await supabaseAdmin.from('organizations').update({
          stripe_subscription_id: subscription.id,
          subscription_status: cancelAtPeriodEnd ? 'canceling' : (isActive ? 'active' : subscription.status),
          subscription_ends_at: cancelAtPeriodEnd && subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        }).eq('id', orgId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata.organization_id
        if (!orgId) break
        await supabaseAdmin.from('organizations').update({
          subscription_status: 'inactive',
          stripe_subscription_id: null,
          subscription_ends_at: null,
        }).eq('id', orgId)
        break
      }
    }
  } catch (err) {
    console.error('Erro ao processar webhook:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

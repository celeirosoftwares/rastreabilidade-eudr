'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'blocked'>('loading')
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: user } = await supabase
        .from('users').select('organization_id').eq('id', session.user.id).single()
      if (!user?.organization_id) { setStatus('blocked'); return }

      const { data: org } = await supabase
        .from('organizations')
        .select('subscription_status, subscription_ends_at')
        .eq('id', user.organization_id)
        .single()

      const s = org?.subscription_status
      const endsAt = org?.subscription_ends_at
      const ok = s === 'active' || (s === 'canceling' && endsAt && new Date(endsAt) > new Date())
      setStatus(ok ? 'ok' : 'blocked')
    }
    check()
  }, [])

  if (status === 'loading') return (
    <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '40px' }}>Verificando assinatura...</div>
  )

  if (status === 'blocked') return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '16px', textAlign: 'center', padding: '40px'
    }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>
        Assinatura necessária
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>
        Para criar e gerenciar propriedades, áreas, lotes e relatórios, você precisa ter uma assinatura ativa.
      </p>
      <a href="/planos" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'var(--accent)', color: 'white', textDecoration: 'none',
        borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600,
        marginTop: '8px'
      }}>
        Ver planos →
      </a>
    </div>
  )

  return <>{children}</>
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', session.user.id)
        .single()

      if (!data) { router.push('/auth/login'); return }

      // Verificar assinatura
      const status = data.organization?.subscription_status
      const endsAt = data.organization?.subscription_ends_at
      const hasAccess =
        status === 'active' ||
        (status === 'canceling' && endsAt && new Date(endsAt) > new Date())

      if (!hasAccess) {
        router.push('/planos')
        return
      }

      setUser(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar user={user} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

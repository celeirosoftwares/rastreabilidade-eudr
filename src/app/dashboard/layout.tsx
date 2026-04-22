// src/app/dashboard/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', session.user.id)
        .single()

      const userProfile = profile ?? {
        id: session.user.id,
        name: session.user.email ?? 'Usuário',
        email: session.user.email ?? '',
        role: 'owner',
        organization_id: '',
        created_at: new Date().toISOString(),
        organization: { name: 'Minha Organização', id: '', created_at: '' },
      }

      setUser(userProfile)
      setLoading(false)
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="text-[#4caf50] text-sm">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-[#0f1a0f] overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

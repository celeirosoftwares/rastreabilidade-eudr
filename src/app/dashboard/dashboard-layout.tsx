// src/app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Busca perfil do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', session.user.id)
    .single()

  // Se não achar perfil, cria um temporário para não travar
  const userProfile = profile ?? {
    id: session.user.id,
    name: session.user.email ?? 'Usuário',
    email: session.user.email ?? '',
    role: 'owner',
    organization_id: '',
    created_at: new Date().toISOString(),
    organization: { name: 'Minha Organização', id: '', created_at: '' },
  }

  return (
    <div className="flex h-screen bg-[#0f1a0f] overflow-hidden">
      <Sidebar user={userProfile as any} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={userProfile as any} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

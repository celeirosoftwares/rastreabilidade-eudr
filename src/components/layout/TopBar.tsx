'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/properties': 'Propriedades',
  '/dashboard/areas':      'Áreas',
  '/dashboard/lots':       'Lotes',
  '/dashboard/reports':    'Relatórios',
  '/dashboard/settings':   'Configurações',
}

export default function TopBar({ user }: { user: any }) {
  const pathname = usePathname()
  const title = Object.entries(routeTitles)
    .filter(([route]) => pathname.startsWith(route))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header style={{
      height: '56px', flexShrink: 0,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-soft)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px 0 64px',
    }} className="topbar">
      <div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'capitalize' }} className="topbar-date">{date}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Bell size={14} color="var(--text-secondary)" />
        </button>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--bg-muted)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .topbar { padding: 0 16px 0 64px !important; }
          .topbar-date { display: none; }
        }
      `}</style>
    </header>
  )
}

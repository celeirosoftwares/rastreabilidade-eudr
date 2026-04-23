'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, MapPin, Layers, Package, FileText, Settings, LogOut, Leaf } from 'lucide-react'

const navItems = [
  { href: '/dashboard',            label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/properties', label: 'Propriedades',  icon: MapPin },
  { href: '/dashboard/areas',      label: 'Áreas',         icon: Layers },
  { href: '/dashboard/lots',       label: 'Lotes',         icon: Package },
  { href: '/dashboard/reports',    label: 'Relatórios',    icon: FileText },
  { href: '/dashboard/settings',   label: 'Configurações', icon: Settings },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside style={{
      width: '220px', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-soft)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Leaf size={14} color="white" />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>RastreiO</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.2, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.organization?.name ?? 'Minha Organização'}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '7px',
              fontSize: '13px', fontWeight: active ? 500 : 400,
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              background: active ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <Icon size={15} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', marginBottom: '2px' }}>
          <div style={{ width: '26px', height: '26px', background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600 }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'Usuário'}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? ''}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '7px 10px', borderRadius: '7px',
          fontSize: '12px', color: 'var(--text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}

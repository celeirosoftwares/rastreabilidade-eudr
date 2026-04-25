'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, MapPin, Layers, Package, FileText, Settings, LogOut, Leaf, Menu, X } from 'lucide-react'
import { useState } from 'react'

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
  const [open, setOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        {/* Botão fechar no mobile */}
        <button onClick={() => setOpen(false)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          className="close-sidebar-btn">
          <X size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 10px', borderRadius: '7px',
                fontSize: '13px', fontWeight: active ? 500 : 400,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-glow)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', marginBottom: '4px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
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
          width: '100%', padding: '8px 10px', borderRadius: '7px',
          fontSize: '12px', color: 'var(--text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: '220px', background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile: botão hamburguer + drawer */}
      <div className="sidebar-mobile-trigger" style={{ display: 'none' }}>
        <button onClick={() => setOpen(true)} style={{
          position: 'fixed', top: '12px', left: '12px', zIndex: 200,
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Menu size={18} color="var(--text-primary)" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 150, backdropFilter: 'blur(4px)',
        }} />
      )}

      {/* Drawer mobile */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '260px', background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex', flexDirection: 'column',
        zIndex: 160,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }} className="sidebar-mobile-drawer">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={14} color="white" />
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>RastreiO</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{user?.organization?.name ?? 'Minha Organização'}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 12px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: active ? 500 : 400,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-glow)' : 'transparent',
                    textDecoration: 'none',
                  }}>
                  <Icon size={17} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '4px' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              fontSize: '13px', color: 'var(--text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <LogOut size={15} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-trigger { display: block !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile-drawer { display: none !important; }
        }
      `}</style>
    </>
  )
}

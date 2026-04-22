// src/components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Leaf,
  LayoutDashboard,
  MapPin,
  Layers,
  Package,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { clsx } from 'clsx'
import type { User } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/properties', label: 'Propriedades', icon: MapPin },
  { href: '/dashboard/areas', label: 'Áreas', icon: Layers },
  { href: '/dashboard/lots', label: 'Lotes', icon: Package },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileText },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  user: User & { organization: { name: string } }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-[#111e11] border-r border-[#1e2e1e] flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[#1e2e1e]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4caf50] rounded-lg flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">RastreiO</div>
            <div className="text-[#4d7a4d] text-xs leading-tight truncate max-w-[140px]">
              {user.organization.name}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-[#4caf50]/15 text-[#4caf50]'
                  : 'text-[#6b8f6b] hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={clsx('w-4 h-4 shrink-0', active ? 'text-[#4caf50]' : '')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuário + Sair */}
      <div className="p-4 border-t border-[#1e2e1e]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 bg-[#2d5a2d] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#4caf50] text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-[#4d7a4d] text-xs truncate">{user.email}</div>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#6b8f6b] hover:text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}

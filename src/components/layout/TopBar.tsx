// src/components/layout/TopBar.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import type { User } from '@/types'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/properties': 'Propriedades',
  '/dashboard/areas': 'Áreas',
  '/dashboard/lots': 'Lotes de Produção',
  '/dashboard/reports': 'Relatórios',
  '/dashboard/settings': 'Configurações',
}

interface TopBarProps {
  user: User & { organization: { name: string } }
}

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()

  const title = Object.entries(routeTitles)
    .filter(([route]) => pathname.startsWith(route))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  return (
    <header className="h-16 bg-[#111e11] border-b border-[#1e2e1e] flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-white font-semibold text-base">{title}</h1>
        <p className="text-[#4d7a4d] text-xs">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-lg bg-[#1e2e1e] hover:bg-[#2d3d2d] flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-[#6b8f6b]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4caf50] rounded-full" />
        </button>

        <div className="w-9 h-9 rounded-lg bg-[#2d5a2d] flex items-center justify-center">
          <span className="text-[#4caf50] text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  )
}

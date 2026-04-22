// src/app/dashboard/properties/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, MapPin, User, ChevronRight, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*, areas(id, name, size_hectares), lots(id, crop_type, status)')
        .order('created_at', { ascending: false })
      setProperties(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Propriedades Rurais</h2>
          <p className="text-[#6b8f6b] text-sm mt-0.5">
            {loading ? 'Carregando...' : `${properties.length} ${properties.length === 1 ? 'propriedade cadastrada' : 'propriedades cadastradas'}`}
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Propriedade
        </Link>
      </div>

      {loading ? (
        <div className="text-[#4d7a4d] text-sm">Carregando propriedades...</div>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5 hover:border-[#4caf50]/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#4caf50]/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#4caf50]" />
                </div>
                <ChevronRight className="w-4 h-4 text-[#3d5a3d] group-hover:text-[#4caf50] transition-colors" />
              </div>

              <h3 className="text-white font-semibold text-base mb-1 truncate">{property.name}</h3>

              <div className="flex items-center gap-1.5 text-[#6b8f6b] text-sm mb-3">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{property.owner_name}</span>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                {property.state && (
                  <span className="bg-[#1e2e1e] text-[#6b8f6b] px-2 py-0.5 rounded-full">
                    {property.municipality ? `${property.municipality}, ` : ''}{property.state}
                  </span>
                )}
                {property.car_number && (
                  <span className="bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    CAR
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[#1e2e1e] flex gap-4 text-xs text-[#4d7a4d]">
                <span>{property.areas?.length ?? 0} áreas</span>
                <span>{property.lots?.length ?? 0} lotes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] border-dashed rounded-2xl p-12 text-center">
      <div className="w-14 h-14 bg-[#1e2e1e] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <MapPin className="w-7 h-7 text-[#3d5a3d]" />
      </div>
      <h3 className="text-white font-semibold mb-2">Nenhuma propriedade cadastrada</h3>
      <p className="text-[#6b8f6b] text-sm mb-5 max-w-sm mx-auto">
        Cadastre sua primeira propriedade rural para começar a rastrear a produção e gerar relatórios de conformidade EUDR.
      </p>
      <Link
        href="/dashboard/properties/new"
        className="inline-flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Cadastrar Propriedade
      </Link>
    </div>
  )
}

// src/app/dashboard/areas/page.tsx
import Link from 'next/link'
import { Plus, Layers, Ruler, ChevronRight } from 'lucide-react'
import { getAreas } from '@/lib/actions/areas'
import { getProperties } from '@/lib/actions/properties'

const LAND_USE_LABELS: Record<string, { label: string; color: string }> = {
  cultivation: { label: 'Cultivo', color: 'text-green-400 bg-green-400/10' },
  native:      { label: 'Vegetação Nativa', color: 'text-emerald-400 bg-emerald-400/10' },
  arl:         { label: 'ARL', color: 'text-blue-400 bg-blue-400/10' },
  app:         { label: 'APP', color: 'text-purple-400 bg-purple-400/10' },
  other:       { label: 'Outro', color: 'text-gray-400 bg-gray-400/10' },
}

export default async function AreasPage() {
  const [areas, properties] = await Promise.all([getAreas(), getProperties()])

  const propertiesMap = Object.fromEntries(properties.map((p) => [p.id, p.name]))

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Áreas Georreferenciadas</h2>
          <p className="text-[#6b8f6b] text-sm mt-0.5">
            {areas.length} {areas.length === 1 ? 'área cadastrada' : 'áreas cadastradas'}
          </p>
        </div>
        <Link
          href="/dashboard/areas/new"
          className="flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Área
        </Link>
      </div>

      {areas.length === 0 ? (
        <EmptyState hasProperties={properties.length > 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => {
            const landUse = LAND_USE_LABELS[area.land_use ?? '']
            return (
              <Link
                key={area.id}
                href={`/dashboard/areas/${area.id}`}
                className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5 hover:border-[#4caf50]/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3d5a3d] group-hover:text-[#4caf50] transition-colors" />
                </div>

                <h3 className="text-white font-semibold mb-1 truncate">{area.name}</h3>
                <p className="text-[#6b8f6b] text-sm mb-3 truncate">
                  {propertiesMap[area.property_id] ?? 'Propriedade não encontrada'}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {landUse && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${landUse.color}`}>
                      {landUse.label}
                    </span>
                  )}
                  {area.size_hectares && (
                    <span className="flex items-center gap-1 text-xs text-[#6b8f6b]">
                      <Ruler className="w-3 h-3" />
                      {Number(area.size_hectares).toFixed(2)} ha
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasProperties }: { hasProperties: boolean }) {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] border-dashed rounded-2xl p-12 text-center">
      <div className="w-14 h-14 bg-[#1e2e1e] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Layers className="w-7 h-7 text-[#3d5a3d]" />
      </div>
      <h3 className="text-white font-semibold mb-2">Nenhuma área cadastrada</h3>
      <p className="text-[#6b8f6b] text-sm mb-5 max-w-sm mx-auto">
        {hasProperties
          ? 'Desenhe polígonos no mapa para delimitar as áreas de cultivo das suas propriedades.'
          : 'Cadastre uma propriedade primeiro para poder adicionar áreas.'}
      </p>
      <Link
        href={hasProperties ? '/dashboard/areas/new' : '/dashboard/properties/new'}
        className="inline-flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        {hasProperties ? 'Cadastrar Área' : 'Cadastrar Propriedade'}
      </Link>
    </div>
  )
}

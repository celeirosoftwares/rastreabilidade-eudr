// src/app/dashboard/lots/page.tsx
import Link from 'next/link'
import { Plus, Package, ChevronRight, Calendar } from 'lucide-react'
import { getLots } from '@/lib/actions/lots'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CROP_LABELS: Record<string, { label: string; emoji: string }> = {
  coffee:    { label: 'Café',           emoji: '☕' },
  soy:       { label: 'Soja',           emoji: '🌱' },
  sugarcane: { label: 'Cana-de-açúcar', emoji: '🌾' },
  corn:      { label: 'Milho',          emoji: '🌽' },
  cotton:    { label: 'Algodão',        emoji: '🤍' },
  other:     { label: 'Outro',          emoji: '🌿' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativo',      color: 'text-green-400 bg-green-400/10' },
  harvested: { label: 'Colhido',    color: 'text-blue-400 bg-blue-400/10' },
  sold:      { label: 'Vendido',    color: 'text-yellow-400 bg-yellow-400/10' },
  archived:  { label: 'Arquivado',  color: 'text-gray-400 bg-gray-400/10' },
}

export default async function LotsPage() {
  const lots = await getLots()

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lotes de Produção</h2>
          <p className="text-[#6b8f6b] text-sm mt-0.5">
            {lots.length} {lots.length === 1 ? 'lote cadastrado' : 'lotes cadastrados'}
          </p>
        </div>
        <Link
          href="/dashboard/lots/new"
          className="flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Lote
        </Link>
      </div>

      {lots.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {lots.map((lot) => {
            const crop = CROP_LABELS[lot.crop_type] ?? { label: lot.crop_type, emoji: '🌿' }
            const status = STATUS_LABELS[lot.status] ?? { label: lot.status, color: 'text-gray-400 bg-gray-400/10' }
            const eventsCount = (lot as any).events?.length ?? 0

            return (
              <Link
                key={lot.id}
                href={`/dashboard/lots/${lot.id}`}
                className="flex items-center gap-4 bg-[#172117] border border-[#2d3d2d] rounded-xl px-5 py-4 hover:border-[#4caf50]/40 transition-colors group"
              >
                <div className="w-10 h-10 bg-[#1e2e1e] rounded-xl flex items-center justify-center shrink-0 text-lg">
                  {crop.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm truncate">
                      {(lot as any).property?.name ?? 'Propriedade'}
                    </span>
                    {lot.area_id && (
                      <>
                        <span className="text-[#3d5a3d]">·</span>
                        <span className="text-[#6b8f6b] text-sm truncate">
                          {(lot as any).area?.name}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#4d7a4d]">
                    <span>{crop.label}</span>
                    {lot.harvest_year && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Safra {lot.harvest_year}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{eventsCount} evento{eventsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#3d5a3d] group-hover:text-[#4caf50] transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] border-dashed rounded-2xl p-12 text-center">
      <div className="w-14 h-14 bg-[#1e2e1e] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Package className="w-7 h-7 text-[#3d5a3d]" />
      </div>
      <h3 className="text-white font-semibold mb-2">Nenhum lote cadastrado</h3>
      <p className="text-[#6b8f6b] text-sm mb-5 max-w-sm mx-auto">
        Crie lotes de produção para rastrear cada safra, registrar eventos e gerar relatórios de conformidade EUDR.
      </p>
      <Link
        href="/dashboard/lots/new"
        className="inline-flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Criar Lote
      </Link>
    </div>
  )
}

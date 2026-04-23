'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CROP_LABELS: Record<string, string> = {
  coffee: 'Café', soy: 'Soja', sugarcane: 'Cana-de-açúcar',
  corn: 'Milho', cotton: 'Algodão', other: 'Outro',
}

export default function ReportsPage() {
  const [lots, setLots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('lots')
        .select('*, property:properties(*), area:areas(*), events(*)')
        .order('created_at', { ascending: false })
      setLots(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Relatórios EUDR</h2>
        <p className="text-[#6b8f6b] text-sm mt-0.5">Gere relatórios de conformidade para exportação à União Europeia</p>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-4 text-sm text-blue-300">
        <p className="font-semibold mb-1">📋 Regulamento (UE) 2023/1115 — EUDR</p>
        <p className="text-blue-400 text-xs leading-relaxed">
          A partir de dezembro de 2024, produtos como café, soja e cana exportados para a UE precisam comprovar ausência de desmatamento após 31/12/2020.
        </p>
      </div>

      {loading ? (
        <div className="text-[#4d7a4d] text-sm">Carregando...</div>
      ) : lots.length === 0 ? (
        <div className="bg-[#172117] border border-[#2d3d2d] border-dashed rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 text-[#3d5a3d] mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Nenhum lote para gerar relatório</h3>
          <Link href="/dashboard/lots/new" className="inline-flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold px-5 py-2.5 rounded-lg mt-4">
            Criar Lote
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lots.map((lot) => {
            const events = lot.events ?? []
            const checks = [!!lot.area_id, events.some((e: any) => e.type === 'planting'), !!lot.property?.car_number, !!lot.property?.document_id]
            const score = checks.filter(Boolean).length
            const total = checks.length
            const isGood = score === total

            return (
              <Link key={lot.id} href={`/dashboard/reports/${lot.id}`}
                className="flex items-center gap-4 bg-[#172117] border border-[#2d3d2d] rounded-xl px-5 py-4 hover:border-[#4caf50]/40 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isGood ? 'bg-green-400/10' : 'bg-yellow-400/10'}`}>
                  {isGood ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {lot.property?.name ?? '—'} — {CROP_LABELS[lot.crop_type] ?? lot.crop_type}
                    {lot.harvest_year ? ` (${lot.harvest_year})` : ''}
                  </p>
                  <p className="text-[#6b8f6b] text-xs mt-0.5">{score}/{total} requisitos · {events.length} evento{events.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isGood ? 'text-green-400' : 'text-yellow-400'}`}>{Math.round((score / total) * 100)}%</div>
                    <div className="text-[#4d7a4d] text-xs">conformidade</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3d5a3d] group-hover:text-[#4caf50]" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

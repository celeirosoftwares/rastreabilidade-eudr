// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Package, Activity, TrendingUp, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CROP_LABELS: Record<string, string> = {
  coffee: '☕ Café',
  soy: '🌱 Soja',
  sugarcane: '🌾 Cana-de-açúcar',
  corn: '🌽 Milho',
  cotton: '🤍 Algodão',
  other: 'Outro',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativo',     color: 'text-green-400 bg-green-400/10' },
  harvested: { label: 'Colhido',   color: 'text-blue-400 bg-blue-400/10' },
  sold:      { label: 'Vendido',   color: 'text-yellow-400 bg-yellow-400/10' },
  archived:  { label: 'Arquivado', color: 'text-gray-400 bg-gray-400/10' },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  planting:      'Plantio',
  harvest:       'Colheita',
  transport:     'Transporte',
  processing:    'Processamento',
  sale:          'Venda',
  certification: 'Certificação',
  inspection:    'Inspeção',
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalLots: 0,
    activeLots: 0,
    byCrop: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    recentEvents: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [propertiesRes, lotsRes, eventsRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('lots').select('id, crop_type, status', { count: 'exact' }),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(6),
      ])

      const lots = lotsRes.data ?? []

      const byCrop = lots.reduce<Record<string, number>>((acc, lot) => {
        acc[lot.crop_type] = (acc[lot.crop_type] ?? 0) + 1
        return acc
      }, {})

      const byStatus = lots.reduce<Record<string, number>>((acc, lot) => {
        acc[lot.status] = (acc[lot.status] ?? 0) + 1
        return acc
      }, {})

      setStats({
        totalProperties: propertiesRes.count ?? 0,
        totalLots: lotsRes.count ?? 0,
        activeLots: byStatus['active'] ?? 0,
        byCrop,
        byStatus,
        recentEvents: eventsRes.data ?? [],
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-[#4d7a4d] text-sm">Carregando...</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Bem-vindo de volta 👋</h2>
        <p className="text-[#6b8f6b] mt-1 text-sm">Aqui está um resumo da sua operação hoje.</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard icon={<MapPin className="w-5 h-5" />} label="Propriedades"
          value={stats.totalProperties} href="/dashboard/properties"
          color="text-emerald-400" bg="bg-emerald-400/10" />
        <MetricCard icon={<Package className="w-5 h-5" />} label="Lotes Ativos"
          value={stats.activeLots} href="/dashboard/lots"
          color="text-blue-400" bg="bg-blue-400/10" />
        <MetricCard icon={<Activity className="w-5 h-5" />} label="Total de Lotes"
          value={stats.totalLots} href="/dashboard/lots"
          color="text-purple-400" bg="bg-purple-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lotes por cultura */}
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Lotes por Cultura</h3>
            <TrendingUp className="w-4 h-4 text-[#4caf50]" />
          </div>
          {Object.keys(stats.byCrop).length === 0 ? (
            <p className="text-[#4d7a4d] text-sm">Nenhum lote cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byCrop).map(([crop, count]) => (
                <div key={crop} className="flex items-center justify-between">
                  <span className="text-[#a0b8a0] text-sm">{CROP_LABELS[crop] ?? crop}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-[#4caf50] rounded-full" style={{ width: `${(count / stats.totalLots) * 80}px` }} />
                    <span className="text-white text-sm font-semibold">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status dos lotes */}
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Status dos Lotes</h3>
          {Object.keys(stats.byStatus).length === 0 ? (
            <p className="text-[#4d7a4d] text-sm">Nenhum lote cadastrado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const s = STATUS_LABELS[status] ?? { label: status, color: 'text-gray-400 bg-gray-400/10' }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <span className="text-white text-sm font-semibold">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* EUDR Status */}
        <div className="bg-gradient-to-br from-[#1a2e1a] to-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-2">Conformidade EUDR</h3>
          <p className="text-[#6b8f6b] text-xs mb-4">Regulamento UE 2023/1115 — Desmatamento zero</p>
          <div className="space-y-3">
            {[
              { label: 'Propriedades georreferenciadas', done: stats.totalProperties > 0 },
              { label: 'Lotes rastreados', done: stats.totalLots > 0 },
              { label: 'Eventos registrados', done: stats.recentEvents.length > 0 },
              { label: 'Relatório EUDR gerado', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-[#4caf50]' : 'bg-[#2d3d2d]'}`}>
                  {item.done && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className={`text-xs ${item.done ? 'text-[#a0b8a0]' : 'text-[#4d7a4d]'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atividade recente */}
      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Atividade Recente</h3>
          <Link href="/dashboard/lots" className="flex items-center gap-1 text-[#4caf50] text-xs hover:text-[#66bb6a]">
            Ver tudo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {stats.recentEvents.length === 0 ? (
          <p className="text-[#4d7a4d] text-sm">Nenhuma atividade recente. Comece criando uma propriedade!</p>
        ) : (
          <div className="space-y-3">
            {stats.recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-[#4caf50] rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#a0b8a0] text-sm">
                    <span className="text-white font-medium">{EVENT_TYPE_LABELS[event.type] ?? event.type}</span>
                    {event.description ? ` — ${event.description}` : ''}
                  </p>
                  <p className="text-[#4d7a4d] text-xs mt-0.5">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, href, color, bg }: {
  icon: React.ReactNode; label: string; value: number
  href: string; color: string; bg: string
}) {
  return (
    <Link href={href} className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5 hover:border-[#4caf50]/30 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>{icon}</div>
        <ArrowRight className="w-4 h-4 text-[#2d3d2d] group-hover:text-[#4caf50] transition-colors" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-[#6b8f6b] text-sm mt-0.5">{label}</div>
    </Link>
  )
}

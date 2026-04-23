'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, User, FileText, Layers, Package, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CROP_LABELS: Record<string, string> = {
  coffee: '☕ Café', soy: '🌱 Soja', sugarcane: '🌾 Cana', corn: '🌽 Milho', other: '🌿 Outro',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativo',     color: 'text-green-400 bg-green-400/10' },
  harvested: { label: 'Colhido',   color: 'text-blue-400 bg-blue-400/10' },
  sold:      { label: 'Vendido',   color: 'text-yellow-400 bg-yellow-400/10' },
  archived:  { label: 'Arquivado', color: 'text-gray-400 bg-gray-400/10' },
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const [property, setProperty] = useState<any>(null)
  const [areas, setAreas] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [propRes, areasRes, lotsRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', id).single(),
        supabase.from('areas').select('*').eq('property_id', id),
        supabase.from('lots').select('*, events(*)').eq('property_id', id),
      ])
      setProperty(propRes.data)
      setAreas(areasRes.data ?? [])
      setLots(lotsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="text-[#4d7a4d] text-sm">Carregando...</div>
  if (!property) return <div className="text-red-400 text-sm">Propriedade não encontrada.</div>

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties" className="text-[#6b8f6b] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">{property.name}</h2>
          <p className="text-[#6b8f6b] text-sm">{property.municipality ? `${property.municipality}, ` : ''}{property.state}</p>
        </div>
      </div>

      {/* Dados do produtor */}
      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Dados do Produtor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: <User className="w-4 h-4" />, label: 'Proprietário', value: property.owner_name },
            { icon: <FileText className="w-4 h-4" />, label: 'CPF/CNPJ', value: property.document_id },
            { icon: <MapPin className="w-4 h-4" />, label: 'CAR', value: property.car_number ?? 'Não informado' },
            { icon: <MapPin className="w-4 h-4" />, label: 'Localização', value: property.municipality ? `${property.municipality}/${property.state}` : property.state ?? '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="text-[#4d7a4d]">{icon}</span>
              <div>
                <div className="text-[#6b8f6b] text-xs">{label}</div>
                <div className="text-white text-sm font-medium">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Áreas */}
      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Áreas ({areas.length})</h3>
          <Link href={`/dashboard/areas/new`}
            className="flex items-center gap-1.5 text-xs text-[#4caf50] hover:text-[#66bb6a]">
            <Plus className="w-3.5 h-3.5" /> Nova área
          </Link>
        </div>
        {areas.length === 0 ? (
          <p className="text-[#4d7a4d] text-sm">Nenhuma área cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {areas.map((area) => (
              <Link key={area.id} href={`/dashboard/areas/${area.id}`}
                className="flex items-center gap-3 p-3 bg-[#1e2e1e] rounded-lg hover:bg-[#2d3d2d] transition-colors">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-white text-sm flex-1">{area.name}</span>
                {area.size_hectares && <span className="text-[#6b8f6b] text-xs">{Number(area.size_hectares).toFixed(2)} ha</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Lotes */}
      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Lotes ({lots.length})</h3>
          <Link href={`/dashboard/lots/new`}
            className="flex items-center gap-1.5 text-xs text-[#4caf50] hover:text-[#66bb6a]">
            <Plus className="w-3.5 h-3.5" /> Novo lote
          </Link>
        </div>
        {lots.length === 0 ? (
          <p className="text-[#4d7a4d] text-sm">Nenhum lote cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {lots.map((lot) => {
              const status = STATUS_LABELS[lot.status] ?? { label: lot.status, color: 'text-gray-400 bg-gray-400/10' }
              return (
                <Link key={lot.id} href={`/dashboard/lots/${lot.id}`}
                  className="flex items-center gap-3 p-3 bg-[#1e2e1e] rounded-lg hover:bg-[#2d3d2d] transition-colors">
                  <Package className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white text-sm flex-1">{CROP_LABELS[lot.crop_type] ?? lot.crop_type}{lot.harvest_year ? ` — ${lot.harvest_year}` : ''}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

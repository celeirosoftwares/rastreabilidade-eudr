// src/app/dashboard/areas/new/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createArea } from '@/lib/actions/areas'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types'

// Importação dinâmica do mapa (evita SSR com Mapbox)
const AreaMap = dynamic(() => import('@/components/map/AreaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl bg-[#1e2e1e] border border-[#2d3d2d] flex items-center justify-center">
      <p className="text-[#4d7a4d] text-sm">Carregando mapa...</p>
    </div>
  ),
})

const LAND_USE_OPTIONS = [
  { value: 'cultivation', label: 'Área de Cultivo' },
  { value: 'native',      label: 'Vegetação Nativa' },
  { value: 'arl',         label: 'ARL — Área de Reserva Legal' },
  { value: 'app',         label: 'APP — Área de Preservação Permanente' },
  { value: 'other',       label: 'Outro' },
]

export default function NewAreaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])

  const [form, setForm] = useState({
    name: '',
    property_id: '',
    land_use: 'cultivation',
    size_hectares: 0,
    geojson: null as GeoJSON.Feature<GeoJSON.Polygon> | null,
  })

  useEffect(() => {
    async function loadProperties() {
      const { data } = await supabase
        .from('properties')
        .select('id, name')
        .order('name')
      setProperties((data as Property[]) ?? [])
      if (data?.length === 1) {
        setForm((prev) => ({ ...prev, property_id: data[0].id }))
      }
    }
    loadProperties()
  }, [])

  const handlePolygonChange = useCallback(
    (geojson: GeoJSON.Feature<GeoJSON.Polygon> | null, hectares: number) => {
      setForm((prev) => ({ ...prev, geojson, size_hectares: hectares }))
    },
    []
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.geojson) {
      setError('Desenhe a área no mapa antes de salvar.')
      return
    }
    if (!form.property_id) {
      setError('Selecione uma propriedade.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createArea({
        name: form.name,
        property_id: form.property_id,
        geojson: form.geojson,
        size_hectares: form.size_hectares,
        land_use: form.land_use as any,
      })
      router.push('/dashboard/areas')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar área.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/areas" className="text-[#6b8f6b] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Nova Área</h2>
          <p className="text-[#6b8f6b] text-sm">Delimite a área no mapa e preencha os dados</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados básicos */}
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">
            Dados da Área
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">
                Nome da área *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Talhão A1 — Café"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">
                Propriedade *
              </label>
              <select
                name="property_id"
                value={form.property_id}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">
              Uso do solo
            </label>
            <select
              name="land_use"
              value={form.land_use}
              onChange={handleChange}
              className={inputClass}
            >
              {LAND_USE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mapa */}
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-4 pb-2 border-b border-[#1e2e1e]">
            Delimitar Área no Mapa
          </h3>
          <AreaMap onPolygonChange={handlePolygonChange} />
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/areas"
            className="flex-1 text-center py-2.5 rounded-lg border border-[#2d3d2d] text-[#6b8f6b] hover:text-white hover:border-[#4d7a4d] transition-colors text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#4caf50] hover:bg-[#43a047] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Área'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm'

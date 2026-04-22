// src/app/dashboard/lots/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createLot } from '@/lib/actions/lots'
import { createClient } from '@/lib/supabase/client'
import type { Property, Area, CoffeeMetadata, SoyMetadata, SugarcaneMetadata } from '@/types'

const CROP_OPTIONS = [
  { value: 'coffee',    label: '☕ Café' },
  { value: 'soy',       label: '🌱 Soja' },
  { value: 'sugarcane', label: '🌾 Cana-de-açúcar' },
  { value: 'corn',      label: '🌽 Milho' },
  { value: 'cotton',    label: '🤍 Algodão' },
  { value: 'other',     label: '🌿 Outro' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

export default function NewLotPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [areas, setAreas] = useState<Area[]>([])

  const [form, setForm] = useState({
    property_id: '',
    area_id: '',
    crop_type: 'coffee',
    harvest_year: CURRENT_YEAR,
    // Café
    processing_type: 'natural',
    quality_score: '',
    variety: '',
    altitude_meters: '',
    bags_quantity: '',
    bag_weight_kg: '60',
    // Soja
    volume_tons: '',
    storage_location: '',
    gmo: false,
    // Cana
    destination: 'both',
    brix_degree: '',
  })

  useEffect(() => {
    supabase.from('properties').select('id, name').order('name').then(({ data }) => {
      setProperties((data as Property[]) ?? [])
    })
  }, [])

  useEffect(() => {
    if (!form.property_id) { setAreas([]); return }
    supabase
      .from('areas')
      .select('id, name')
      .eq('property_id', form.property_id)
      .order('name')
      .then(({ data }) => setAreas((data as Area[]) ?? []))
  }, [form.property_id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  function buildMetadata() {
    switch (form.crop_type) {
      case 'coffee': {
        const meta: CoffeeMetadata = {
          processing_type: form.processing_type as any,
        }
        if (form.quality_score)   meta.quality_score   = Number(form.quality_score)
        if (form.variety)         meta.variety         = form.variety
        if (form.altitude_meters) meta.altitude_meters = Number(form.altitude_meters)
        if (form.bags_quantity)   meta.bags_quantity   = Number(form.bags_quantity)
        if (form.bag_weight_kg)   meta.bag_weight_kg   = Number(form.bag_weight_kg)
        return meta
      }
      case 'soy': {
        const meta: SoyMetadata = { gmo: form.gmo }
        if (form.volume_tons)       meta.volume_tons       = Number(form.volume_tons)
        if (form.storage_location)  meta.storage_location  = form.storage_location
        return meta
      }
      case 'sugarcane': {
        const meta: SugarcaneMetadata = { destination: form.destination as any }
        if (form.volume_tons)  meta.volume_tons  = Number(form.volume_tons)
        if (form.brix_degree)  meta.brix_degree  = Number(form.brix_degree)
        return meta
      }
      default:
        return {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.property_id) { setError('Selecione uma propriedade.'); return }

    setLoading(true)
    setError(null)

    try {
      await createLot({
        property_id: form.property_id,
        area_id: form.area_id || undefined,
        crop_type: form.crop_type as any,
        harvest_year: form.harvest_year,
        metadata: buildMetadata(),
      })
      router.push('/dashboard/lots')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar lote.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/lots" className="text-[#6b8f6b] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Novo Lote de Produção</h2>
          <p className="text-[#6b8f6b] text-sm">Cadastre um lote e defina os dados da cultura</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vínculo */}
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">
            Localização do Lote
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Propriedade *">
              <select name="property_id" value={form.property_id} onChange={handleChange} required className={inputClass}>
                <option value="">Selecione...</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>

            <Field label="Área (opcional)">
              <select name="area_id" value={form.area_id} onChange={handleChange} className={inputClass} disabled={!form.property_id}>
                <option value="">Sem área específica</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cultura *">
              <select name="crop_type" value={form.crop_type} onChange={handleChange} className={inputClass}>
                {CROP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Ano de safra">
              <select name="harvest_year" value={form.harvest_year} onChange={handleChange} className={inputClass}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Campos dinâmicos por cultura */}
        {form.crop_type === 'coffee' && (
          <CoffeeFields form={form} onChange={handleChange} />
        )}
        {form.crop_type === 'soy' && (
          <SoyFields form={form} onChange={handleChange} />
        )}
        {form.crop_type === 'sugarcane' && (
          <SugarcaneFields form={form} onChange={handleChange} />
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard/lots"
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
            {loading ? 'Salvando...' : 'Salvar Lote'}
          </button>
        </div>
      </form>
    </div>
  )
}

// -------- Sub-formulários por cultura --------

function CoffeeFields({ form, onChange }: { form: any; onChange: any }) {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">
        ☕ Dados específicos — Café
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tipo de processamento">
          <select name="processing_type" value={form.processing_type} onChange={onChange} className={inputClass}>
            <option value="natural">Natural (Seco)</option>
            <option value="washed">Lavado (Úmido)</option>
            <option value="honey">Honey</option>
            <option value="pulped_natural">Despolpado Natural</option>
          </select>
        </Field>

        <Field label="Pontuação de qualidade (SCA 0–100)">
          <input type="number" name="quality_score" value={form.quality_score} onChange={onChange}
            min="0" max="100" placeholder="Ex: 84" className={inputClass} />
        </Field>

        <Field label="Variedade">
          <input name="variety" value={form.variety} onChange={onChange}
            placeholder="Ex: Bourbon, Catuaí, Mundo Novo" className={inputClass} />
        </Field>

        <Field label="Altitude (metros)">
          <input type="number" name="altitude_meters" value={form.altitude_meters} onChange={onChange}
            placeholder="Ex: 1100" className={inputClass} />
        </Field>

        <Field label="Quantidade de sacas">
          <input type="number" name="bags_quantity" value={form.bags_quantity} onChange={onChange}
            placeholder="Ex: 500" className={inputClass} />
        </Field>

        <Field label="Peso por saca (kg)">
          <input type="number" name="bag_weight_kg" value={form.bag_weight_kg} onChange={onChange}
            placeholder="60" className={inputClass} />
        </Field>
      </div>
    </div>
  )
}

function SoyFields({ form, onChange }: { form: any; onChange: any }) {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">
        🌱 Dados específicos — Soja
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Volume (toneladas)">
          <input type="number" name="volume_tons" value={form.volume_tons} onChange={onChange}
            placeholder="Ex: 1500" className={inputClass} />
        </Field>

        <Field label="Local de armazenamento">
          <input name="storage_location" value={form.storage_location} onChange={onChange}
            placeholder="Ex: Silo 3 — Fazenda" className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" name="gmo" checked={form.gmo} onChange={onChange}
          className="w-4 h-4 rounded border-[#2d3d2d] bg-[#0f1a0f] accent-[#4caf50]" />
        <span className="text-sm text-[#a0b8a0]">Produto transgênico (GMO)</span>
      </label>
    </div>
  )
}

function SugarcaneFields({ form, onChange }: { form: any; onChange: any }) {
  return (
    <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">
        🌾 Dados específicos — Cana-de-açúcar
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Destino da produção">
          <select name="destination" value={form.destination} onChange={onChange} className={inputClass}>
            <option value="sugar">Açúcar</option>
            <option value="ethanol">Etanol</option>
            <option value="both">Ambos</option>
          </select>
        </Field>

        <Field label="Grau Brix (°Bx)">
          <input type="number" name="brix_degree" value={form.brix_degree} onChange={onChange}
            step="0.1" placeholder="Ex: 18.5" className={inputClass} />
        </Field>

        <Field label="Volume estimado (toneladas)">
          <input type="number" name="volume_tons" value={form.volume_tons} onChange={onChange}
            placeholder="Ex: 5000" className={inputClass} />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm'

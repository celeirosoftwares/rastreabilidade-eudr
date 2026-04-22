// src/components/lots/AddEventForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createEvent } from '@/lib/actions/lots'

const EVENT_TYPES = [
  { value: 'planting',      label: '🌱 Plantio' },
  { value: 'harvest',       label: '🌾 Colheita' },
  { value: 'transport',     label: '🚛 Transporte' },
  { value: 'processing',    label: '⚙️ Processamento' },
  { value: 'sale',          label: '💰 Venda' },
  { value: 'certification', label: '📋 Certificação' },
  { value: 'inspection',    label: '🔍 Inspeção' },
]

export default function AddEventForm({ lotId }: { lotId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    type: 'planting',
    description: '',
    date: today,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await createEvent({
        lot_id: lotId,
        type: form.type as any,
        description: form.description || undefined,
        date: form.date,
      })

      setSuccess(true)
      setForm({ type: 'planting', description: '', date: today })
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao registrar evento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 text-sm">
          ✓ Evento registrado com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#a0b8a0] mb-1.5">Tipo de evento</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#a0b8a0] mb-1.5">Data</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#a0b8a0] mb-1.5">
          Descrição (opcional)
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Detalhes adicionais sobre este evento..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-[#1e2e1e] hover:bg-[#2d3d2d] border border-[#2d3d2d] hover:border-[#4caf50]/40 text-[#4caf50] font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? 'Registrando...' : 'Registrar Evento'}
      </button>
    </form>
  )
}

const inputClass =
  'w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-3 py-2 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm'

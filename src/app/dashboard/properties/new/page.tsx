// src/app/dashboard/properties/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createProperty } from '@/lib/actions/properties'

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
]

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    document_id: '',
    car_number: '',
    state: '',
    municipality: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createProperty(form)
      router.push('/dashboard/properties')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar propriedade.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/properties" className="text-[#6b8f6b] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Nova Propriedade</h2>
          <p className="text-[#6b8f6b] text-sm">Preencha os dados da propriedade rural</p>
        </div>
      </div>

      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6">
        {error && (
          <div className="mb-5 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados da Propriedade */}
          <section>
            <h3 className="text-white font-semibold text-sm mb-3 pb-2 border-b border-[#1e2e1e]">
              Dados da Propriedade
            </h3>
            <div className="space-y-4">
              <Field label="Nome da propriedade *">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Fazenda Boa Vista"
                  required
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Estado">
                  <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                    <option value="">Selecione...</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Município">
                  <input
                    name="municipality"
                    value={form.municipality}
                    onChange={handleChange}
                    placeholder="Ex: Patrocínio"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Número do CAR (Cadastro Ambiental Rural)">
                <input
                  name="car_number"
                  value={form.car_number}
                  onChange={handleChange}
                  placeholder="Ex: MG-3150570-..."
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* Dados do Proprietário */}
          <section>
            <h3 className="text-white font-semibold text-sm mb-3 pb-2 border-b border-[#1e2e1e]">
              Dados do Proprietário
            </h3>
            <div className="space-y-4">
              <Field label="Nome do proprietário *">
                <input
                  name="owner_name"
                  value={form.owner_name}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="CPF ou CNPJ *">
                <input
                  name="document_id"
                  value={form.document_id}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/properties"
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
              {loading ? 'Salvando...' : 'Salvar Propriedade'}
            </button>
          </div>
        </form>
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

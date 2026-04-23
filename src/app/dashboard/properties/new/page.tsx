// src/app/dashboard/properties/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [form, setForm] = useState({ name: '', owner_name: '', document_id: '', car_number: '', state: '', municipality: '' })

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('users').select('organization_id').eq('id', session.user.id).single()
      if (data?.organization_id) setOrgId(data.organization_id)
    }
    loadOrg()
  }, [])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!orgId) { setError('Organização não encontrada.'); return }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('properties').insert({ ...form, organization_id: orgId })
      if (insertError) throw new Error(insertError.message)
      router.push('/dashboard/properties')
      router.refresh()
    } catch (err) {
      setError(err.message ?? 'Erro ao salvar.')
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
        {error && <div className="mb-5 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">Dados da Propriedade</h3>
            <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Nome da propriedade *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Fazenda Boa Vista" required className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Estado</label><select name="state" value={form.state} onChange={handleChange} className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4caf50] transition-colors text-sm"><option value="">Selecione...</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Município</label><input name="municipality" value={form.municipality} onChange={handleChange} placeholder="Ex: Patrocínio" className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Número do CAR</label><input name="car_number" value={form.car_number} onChange={handleChange} placeholder="Ex: MG-3150570-..." className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm" /></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm pb-2 border-b border-[#1e2e1e]">Dados do Proprietário</h3>
            <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Nome do proprietário *</label><input name="owner_name" value={form.owner_name} onChange={handleChange} placeholder="Nome completo" required className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">CPF ou CNPJ *</label><input name="document_id" value={form.document_id} onChange={handleChange} placeholder="000.000.000-00" required className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/properties" className="flex-1 text-center py-2.5 rounded-lg border border-[#2d3d2d] text-[#6b8f6b] hover:text-white transition-colors text-sm font-medium">Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 bg-[#4caf50] hover:bg-[#43a047] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm">{loading ? 'Salvando...' : 'Salvar Propriedade'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

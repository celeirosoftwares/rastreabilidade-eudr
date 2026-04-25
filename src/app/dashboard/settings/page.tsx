'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, CreditCard, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', session.user.id)
        .single()
      setUser(data)
      setForm({ name: data?.name ?? '' })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({ name: form.name }).eq('id', user.id)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setPortalLoading(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>

  const org = user?.organization
  const status = org?.subscription_status
  const endsAt = org?.subscription_ends_at

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active:    { label: 'Ativa',      color: '#5a9e5a', icon: CheckCircle2 },
    canceling: { label: 'Cancelando', color: '#d4a017', icon: AlertTriangle },
    inactive:  { label: 'Inativa',    color: '#c0392b', icon: XCircle },
  }

  const statusInfo = statusConfig[status] ?? statusConfig['inactive']
  const StatusIcon = statusInfo.icon

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>Configurações</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Gerencie sua conta e assinatura</p>
      </div>

      {/* Assinatura */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' }}>
          Assinatura
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <StatusIcon size={14} color={statusInfo.color} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: statusInfo.color }}>{statusInfo.label}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {status === 'active' && 'R$397/mês • Acesso completo'}
              {status === 'canceling' && endsAt && `Acesso até ${new Date(endsAt).toLocaleDateString('pt-BR')}`}
              {status === 'inactive' && 'Sem assinatura ativa'}
            </div>
          </div>

          {status === 'inactive' ? (
            <a href="/planos" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: 'white', textDecoration: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500 }}>
              Assinar agora
            </a>
          ) : (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}
            >
              {portalLoading ? <Loader2 size={14} /> : <CreditCard size={14} />}
              {portalLoading ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          )}
        </div>

        {status === 'canceling' && endsAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#d4a017' }}>
            <AlertTriangle size={14} />
            Sua assinatura foi cancelada. Você mantém acesso até {new Date(endsAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </div>
        )}
      </div>

      {/* Organização */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' }}>
          Organização
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nome</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{org?.name ?? '—'}</span>
        </div>
      </div>

      {/* Perfil */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' }}>
          Perfil
        </h3>

        {success && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(90,158,90,0.1)', border: '1px solid rgba(90,158,90,0.3)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px' }}>
            ✓ Salvo com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Nome</label>
            <input
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>E-mail</label>
            <input
              value={user?.email ?? ''}
              disabled
              style={{ width: '100%', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'not-allowed' }}
            />
          </div>
          <button type="submit" disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px',
            padding: '9px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            {saving ? <Loader2 size={14} /> : <Save size={14} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}

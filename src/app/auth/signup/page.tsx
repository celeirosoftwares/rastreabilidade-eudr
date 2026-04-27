'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', orgName: '', email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 2. Criar organização
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: form.orgName, subscription_status: 'inactive' })
        .select()
        .single()
      if (orgError) throw new Error(orgError.message)

      // 3. Criar perfil do usuário
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: form.email,
          name: form.name,
          organization_id: org.id,
          role: 'owner',
        })
      if (userError) throw new Error(userError.message)

      // 4. Redirecionar direto para o Stripe Checkout
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Erro ao criar sessão de pagamento')
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f0d',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{ width: '36px', height: '36px', background: '#5a9e5a', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Leaf size={18} color="white" />
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '20px', fontFamily: 'sans-serif' }}>RastreiO</span>
      </div>

      <div style={{ background: '#141614', border: '1px solid #1e221e', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '6px', fontFamily: 'sans-serif' }}>
          Criar conta
        </h2>
        <p style={{ color: '#4d7a4d', fontSize: '13px', marginBottom: '24px' }}>
          Após o cadastro você será redirecionado para o pagamento (R$397/mês)
        </p>

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '8px', color: '#e74c3c', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: '#7a8a7a', fontSize: '12px', marginBottom: '6px' }}>Seu nome</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="João da Silva"
              required style={{ width: '100%', background: '#0d0f0d', border: '1px solid #1e221e', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#7a8a7a', fontSize: '12px', marginBottom: '6px' }}>Nome da fazenda / organização</label>
            <input name="orgName" value={form.orgName} onChange={handleChange} placeholder="Fazenda Boa Vista"
              required style={{ width: '100%', background: '#0d0f0d', border: '1px solid #1e221e', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#7a8a7a', fontSize: '12px', marginBottom: '6px' }}>E-mail</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="joao@fazenda.com.br"
              required style={{ width: '100%', background: '#0d0f0d', border: '1px solid #1e221e', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#7a8a7a', fontSize: '12px', marginBottom: '6px' }}>Senha</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres"
              required minLength={6} style={{ width: '100%', background: '#0d0f0d', border: '1px solid #1e221e', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#5a9e5a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '4px', fontFamily: 'sans-serif'
          }}>
            {loading && <Loader2 size={16} />}
            {loading ? 'Criando conta e redirecionando...' : 'Criar conta e assinar →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#3d4d3d', marginTop: '20px' }}>
          Já tem conta?{' '}
          <Link href="/auth/login" style={{ color: '#5a9e5a', textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: '#2d3d2d', textAlign: 'center' }}>
        🔒 Pagamento seguro via Stripe · Cancele quando quiser
      </p>
    </div>
  )
}

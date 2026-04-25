'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Check, Loader2, AlertTriangle } from 'lucide-react'

function PlanosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
    }
    load()
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Erro:', data.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('Erro:', err)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
        <div style={{ width: '36px', height: '36px', background: '#5a9e5a', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Leaf size={18} color="white" />
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '20px', fontFamily: 'sans-serif' }}>RastreiO</span>
      </div>

      {canceled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#d4a017', maxWidth: '420px', width: '100%' }}>
          <AlertTriangle size={16} />
          Pagamento cancelado. Assine para acessar a plataforma.
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px', fontFamily: 'sans-serif' }}>
          Acesso Completo à Plataforma
        </h1>
        <p style={{ color: '#7a8a7a', fontSize: '14px', maxWidth: '420px', lineHeight: 1.6, margin: '0 auto' }}>
          Um único plano com todos os recursos disponíveis. Sem limites, sem restrições.
        </p>
      </div>

      <div style={{ background: '#141614', border: '2px solid #5a9e5a', borderRadius: '20px', padding: '40px', maxWidth: '420px', width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#5a9e5a', color: 'white', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', padding: '4px 16px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
          ACESSO COMPLETO
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '2px' }}>
            <span style={{ fontSize: '20px', marginTop: '14px', color: 'white', fontFamily: 'sans-serif' }}>R$</span>
            <span style={{ fontSize: '52px', fontWeight: 700, color: 'white', lineHeight: 1, fontFamily: 'sans-serif' }}>397</span>
          </div>
          <div style={{ color: '#4d7a4d', fontSize: '13px', marginTop: '4px' }}>por mês • cancele quando quiser</div>
        </div>

        <div style={{ background: 'rgba(90,158,90,0.06)', border: '1px solid rgba(90,158,90,0.15)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a9e5a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            Tudo incluído
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Propriedades rurais ilimitadas',
              'Áreas georreferenciadas ilimitadas',
              'Lotes de produção ilimitados',
              'Relatórios EUDR com checklist automático',
              'DDS (Due Diligence Statement) em PDF',
              'Link público de verificação permanente',
              'Mapa com Google Maps atualizado',
              'Cadeia de custódia completa',
              'Suporte dedicado',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', background: 'rgba(90,158,90,0.2)', border: '1px solid rgba(90,158,90,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="#5a9e5a" />
                </div>
                <span style={{ fontSize: '13px', color: '#b8d4a0' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSubscribe} disabled={loading}
          style={{ width: '100%', background: '#5a9e5a', color: 'white', border: 'none', borderRadius: '10px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'sans-serif' }}>
          {loading && <Loader2 size={16} />}
          {loading ? 'Redirecionando...' : 'Assinar por R$397/mês →'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
          {['🔒 Pagamento seguro', '📋 Nota fiscal', '❌ Cancele quando quiser'].map((item) => (
            <span key={item} style={{ fontSize: '11px', color: '#3d4d3d' }}>{item}</span>
          ))}
        </div>
      </div>

      <button onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/login')
      }} style={{ marginTop: '24px', background: 'none', border: 'none', color: '#3d4d3d', fontSize: '12px', cursor: 'pointer' }}>
        Sair da conta
      </button>
    </div>
  )
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4d7a4d', fontSize: '14px' }}>Carregando...</div>}>
      <PlanosContent />
    </Suspense>
  )
}

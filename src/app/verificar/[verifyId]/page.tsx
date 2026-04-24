'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Leaf, ExternalLink } from 'lucide-react'

const CROP_LABELS: Record<string, string> = {
  coffee: 'Café', soy: 'Soja', sugarcane: 'Cana-de-açúcar',
  corn: 'Milho', cotton: 'Algodão', other: 'Outro',
}

export default function VerifyPage() {
  const { verifyId } = useParams()
  const [status, setStatus] = useState<'loading' | 'found' | 'notfound'>('loading')
  const [doc, setDoc] = useState<any>(null)

  useEffect(() => {
    async function verify() {
      const supabase = createClient()
      const { data } = await supabase
        .from('dds_documents')
        .select('*, lot:lots(*, property:properties(*), area:areas(*)), user:users(name, email, organization:organizations(name))')
        .eq('verify_id', verifyId)
        .single()

      if (data) {
        setDoc(data)
        setStatus('found')
      } else {
        setStatus('notfound')
      }
    }
    verify()
  }, [verifyId])

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{ width: '36px', height: '36px', background: '#5a9e5a', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Leaf size={18} color="white" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '16px', fontFamily: 'sans-serif' }}>RastreiO</div>
          <div style={{ color: '#4d7a4d', fontSize: '11px', fontFamily: 'sans-serif' }}>Plataforma de Conformidade EUDR</div>
        </div>
      </div>

      {status === 'loading' && (
        <div style={{ color: '#4d7a4d', fontSize: '14px', fontFamily: 'sans-serif' }}>Verificando documento...</div>
      )}

      {status === 'notfound' && (
        <div style={{ background: '#141614', border: '1px solid #252925', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <XCircle size={48} color="#c0392b" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '8px', fontFamily: 'sans-serif' }}>
            Documento não encontrado
          </div>
          <div style={{ color: '#7a8a7a', fontSize: '13px', fontFamily: 'sans-serif', marginBottom: '16px' }}>
            O ID de verificação <strong style={{ color: '#e8ece8' }}>{verifyId}</strong> não corresponde a nenhum documento registrado na plataforma RastreiO.
          </div>
          <div style={{ background: '#1f231f', border: '1px solid #252925', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4d7a4d', fontFamily: 'sans-serif' }}>
            Se você recebeu este código em um documento físico, verifique se digitou corretamente ou entre em contato com o emissor.
          </div>
        </div>
      )}

      {status === 'found' && doc && (
        <div style={{ background: '#141614', border: '1px solid #252925', borderRadius: '16px', padding: '32px', maxWidth: '560px', width: '100%' }}>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: 'rgba(90,158,90,0.1)', border: '1px solid rgba(90,158,90,0.3)', borderRadius: '10px' }}>
            <CheckCircle2 size={32} color="#5a9e5a" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ color: '#5a9e5a', fontWeight: 700, fontSize: '15px', fontFamily: 'sans-serif' }}>Documento Verificado ✓</div>
              <div style={{ color: '#7a8a7a', fontSize: '12px', fontFamily: 'sans-serif', marginTop: '2px' }}>
                Este DDS é autêntico e foi gerado pela plataforma RastreiO
              </div>
            </div>
          </div>

          {/* ID */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#1f231f', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#5a9e5a', textAlign: 'center', border: '1px solid #252925' }}>
            {verifyId}
          </div>

          {/* Dados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Organização', value: doc.user?.organization?.name ?? '—' },
              { label: 'Responsável', value: doc.user?.name ?? '—' },
              { label: 'Propriedade', value: doc.lot?.property?.name ?? '—' },
              { label: 'Proprietário', value: doc.lot?.property?.owner_name ?? '—' },
              { label: 'CAR', value: doc.lot?.property?.car_number ?? 'Não informado' },
              { label: 'Município/Estado', value: doc.lot?.property?.municipality ? `${doc.lot.property.municipality}/${doc.lot.property.state}` : doc.lot?.property?.state ?? '—' },
              { label: 'Cultura', value: CROP_LABELS[doc.lot?.crop_type] ?? doc.lot?.crop_type ?? '—' },
              { label: 'Safra', value: doc.lot?.harvest_year ? String(doc.lot.harvest_year) : '—' },
              { label: 'Área', value: doc.lot?.area?.name ?? '—' },
              { label: 'Tamanho da área', value: doc.lot?.area?.size_hectares ? `${Number(doc.lot.area.size_hectares).toFixed(2)} ha` : '—' },
              { label: 'Documento gerado em', value: new Date(doc.generated_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: '1px solid #1e221e' }}>
                <span style={{ fontSize: '12px', color: '#4d7a4d', fontFamily: 'sans-serif', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: '12px', color: '#e8ece8', fontFamily: 'sans-serif', fontWeight: 500, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#1f231f', borderRadius: '8px', fontSize: '11px', color: '#4d7a4d', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            Este documento foi emitido em conformidade com o <strong style={{ color: '#7a8a7a' }}>Regulamento (UE) 2023/1115</strong> — EU Deforestation Regulation (EUDR).
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', fontSize: '11px', color: '#3d4d3d', fontFamily: 'sans-serif' }}>
        © {new Date().getFullYear()} RastreiO — Plataforma de Rastreabilidade EUDR
      </div>
    </div>
  )
}

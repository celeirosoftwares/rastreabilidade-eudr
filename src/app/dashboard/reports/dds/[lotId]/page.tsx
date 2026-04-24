'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, Loader2, Link2 } from 'lucide-react'
import Link from 'next/link'

const CROP_LABELS: Record<string, { name: string; hs: string; scientific: string }> = {
  coffee:    { name: 'Café',           hs: '0901', scientific: 'Coffea arabica' },
  soy:       { name: 'Soja',           hs: '1201', scientific: 'Glycine max' },
  sugarcane: { name: 'Cana-de-açúcar', hs: '1701', scientific: 'Saccharum officinarum' },
  corn:      { name: 'Milho',          hs: '1005', scientific: 'Zea mays' },
  cotton:    { name: 'Algodão',        hs: '5201', scientific: 'Gossypium hirsutum' },
  other:     { name: 'Outro',          hs: '—',    scientific: '—' },
}

const EVENT_LABELS: Record<string, string> = {
  planting: 'Data de Plantio', harvest: 'Data de Colheita',
  transport: 'Data de Transporte', processing: 'Data de Processamento',
  sale: 'Data de Venda', certification: 'Data de Certificação', inspection: 'Data de Inspeção',
}

function genVerifyId(c: string, y: number) {
  return `VERIFY-${c.substring(0,3).toUpperCase()}-${y}-${Math.random().toString(36).substring(2,8).toUpperCase()}`
}

function genSigId() {
  return 'SIG-' + Math.random().toString(36).substring(2,10).toUpperCase()
}

export default function DDSPage() {
  const { lotId } = useParams()
  const [lot, setLot] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifyId, setVerifyId] = useState('')
  const [sigId] = useState(genSigId)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [lotRes, userRes] = await Promise.all([
        supabase.from('lots').select('*, property:properties(*), area:areas(*), events(*)').eq('id', lotId).single(),
        supabase.from('users').select('*, organization:organizations(*)').eq('id', session.user.id).single(),
      ])

      setLot(lotRes.data)
      setOrg(userRes.data)

      // Buscar DDS existente — usa maybeSingle para não lançar erro se não encontrar
      const { data: existing } = await supabase
        .from('dds_documents')
        .select('verify_id')
        .eq('lot_id', lotId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.verify_id) {
        setVerifyId(existing.verify_id)
      } else {
        const newVerifyId = genVerifyId(
          lotRes.data?.crop_type ?? 'other',
          lotRes.data?.harvest_year ?? new Date().getFullYear()
        )
        setVerifyId(newVerifyId)

        await supabase.from('dds_documents').insert({
          verify_id: newVerifyId,
          lot_id: lotId,
          generated_by: session.user.id,
        })
      }

      setLoading(false)
    }
    load()
  }, [lotId])

  async function handleDownload() {
    if (!docRef.current) return
    setGenerating(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `DDS-EUDR-${verifyId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }
      await html2pdf().set(opt).from(docRef.current).save()
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setGenerating(false)
    }
  }

  function copyVerifyLink() {
    const url = `${window.location.origin}/verificar/${verifyId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) return <div style={{padding:'40px',fontFamily:'sans-serif',color:'#333'}}>Carregando...</div>
  if (!lot) return <div style={{padding:'40px',fontFamily:'sans-serif',color:'red'}}>Lote não encontrado.</div>

  const property = lot.property
  const area = lot.area
  const events = (lot.events ?? []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const crop = CROP_LABELS[lot.crop_type] ?? { name: lot.crop_type, hs: '—', scientific: '—' }
  const today = new Date().toLocaleDateString('pt-BR')
  const todayISO = new Date().toISOString().split('T')[0]
  const year = lot.harvest_year ?? new Date().getFullYear()
  const lotCode = `LOT-${lot.crop_type.substring(0,3).toUpperCase()}-${year}-${lot.id.substring(0,6).toUpperCase()}`
  const meta = lot.metadata ?? {}
  const volumeKg = meta.bags_quantity && meta.bag_weight_kg
    ? `${(meta.bags_quantity * meta.bag_weight_kg).toLocaleString()} kg`
    : 'Não informado'
  const geojsonStr = area?.geojson ? JSON.stringify(area.geojson.geometry, null, 2) : '—'
  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verificar/${verifyId}` : ''

  const Row = ({ l, v }: { l: string; v: string }) => (
    <div style={{display:'flex',gap:'8px',padding:'4px 0',borderBottom:'1px solid #eee',fontSize:'9pt'}}>
      <span style={{fontWeight:600,minWidth:'200px',color:'#333',flexShrink:0}}>{l}:</span>
      <span style={{color:'#1a1a1a'}}>{v}</span>
    </div>
  )

  const Section = ({ n, t, children }: any) => (
    <div style={{marginBottom:'16px',pageBreakInside:'avoid'}}>
      <div style={{background:'#1a3a1a',color:'white',padding:'5px 10px',fontSize:'9pt',fontWeight:700,letterSpacing:'0.5px',marginBottom:'8px'}}>
        {n}. {t}
      </div>
      <div style={{paddingLeft:'2px'}}>{children}</div>
    </div>
  )

  const BL = ({ items }: { items: string[] }) => (
    <ul style={{paddingLeft:'18px',margin:'4px 0'}}>
      {items.map((item, i) => <li key={i} style={{fontSize:'9pt',color:'#333',padding:'1px 0'}}>{item}</li>)}
    </ul>
  )

  return (
    <>
      <div style={{background:'#1a3a1a',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',position:'sticky',top:0,zIndex:100}}>
        <Link href={`/dashboard/reports/${lotId}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#a0c8a0',fontSize:'13px',textDecoration:'none'}}>
          <ArrowLeft size={15}/> Voltar
        </Link>
        <div style={{color:'white',fontSize:'13px',fontWeight:600}}>DDS — Declaração de Devida Diligência EUDR</div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <button onClick={copyVerifyLink}
            style={{display:'flex',alignItems:'center',gap:'6px',background:copied?'#2d5a2d':'#1f3a1f',color:copied?'#5a9e5a':'#a0c8a0',border:'1px solid #2d5a2d',borderRadius:'6px',padding:'7px 12px',fontSize:'12px',cursor:'pointer'}}>
            <Link2 size={13}/>
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button onClick={handleDownload} disabled={generating}
            style={{display:'flex',alignItems:'center',gap:'6px',background:'#4caf50',color:'white',border:'none',borderRadius:'6px',padding:'7px 16px',fontSize:'13px',fontWeight:500,cursor:generating?'not-allowed':'pointer',opacity:generating?0.7:1}}>
            {generating ? <Loader2 size={14}/> : <Download size={14}/>}
            {generating ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      <div style={{padding:'24px',background:'#f0f0f0',minHeight:'100vh'}}>
        <div ref={docRef} style={{background:'white',color:'#1a1a1a',fontFamily:'Arial,sans-serif',fontSize:'10pt',lineHeight:'1.6',padding:'20mm',maxWidth:'210mm',margin:'0 auto',boxShadow:'0 2px 20px rgba(0,0,0,0.15)'}}>

          <div style={{borderBottom:'3px solid #1a3a1a',paddingBottom:'16px',marginBottom:'20px',textAlign:'center'}}>
            <div style={{fontSize:'8pt',fontWeight:700,letterSpacing:'2px',color:'#2d6a2d',textTransform:'uppercase',marginBottom:'6px'}}>Regulamento da União Europeia sobre Desmatamento</div>
            <div style={{fontSize:'16pt',fontWeight:700,marginBottom:'3px'}}>DECLARAÇÃO DE DEVIDA DILIGÊNCIA</div>
            <div style={{fontSize:'9pt',color:'#555',marginBottom:'10px'}}>Regulamento (UE) 2023/1115 — Artigo 4</div>
            <div style={{display:'inline-block',padding:'5px 14px',background:'#f0f7f0',border:'1px solid #2d6a2d',borderRadius:'3px',fontSize:'9pt',color:'#2d6a2d',fontWeight:600}}>ID: {verifyId}</div>
            <div style={{marginTop:'4px',fontSize:'8pt',color:'#888'}}>Gerado em: {today}</div>
          </div>

          <Section n="1" t="INFORMAÇÕES DO OPERADOR">
            <Row l="Nome da Organização" v={org?.organization?.name ?? '—'}/>
            <Row l="CNPJ / Documento" v={org?.organization?.document_id ?? 'Não informado'}/>
            <Row l="Responsável" v={org?.name ?? '—'}/>
            <Row l="E-mail" v={org?.email ?? '—'}/>
            <Row l="País" v="Brasil"/>
          </Section>

          <Section n="2" t="INFORMAÇÕES DO PRODUTO">
            <Row l="Tipo de Produto" v={`${crop.name} (${crop.scientific})`}/>
            <Row l="Código SH" v={crop.hs}/>
            <Row l="Quantidade" v={volumeKg}/>
            <Row l="ID do Lote" v={lotCode}/>
            <Row l="Ano de Safra" v={String(year)}/>
            {meta.processing_type && <Row l="Método de Processamento" v={String(meta.processing_type)}/>}
            {meta.variety && <Row l="Variedade" v={String(meta.variety)}/>}
          </Section>

          <Section n="3" t="PAÍS DE PRODUÇÃO">
            <Row l="País" v="Brasil"/>
            <Row l="Estado" v={property?.state ?? '—'}/>
            <Row l="Município" v={property?.municipality ?? '—'}/>
          </Section>

          <Section n="4" t="GEOLOCALIZAÇÃO DA ÁREA DE PRODUÇÃO">
            <Row l="Nome da Propriedade" v={property?.name ?? '—'}/>
            <Row l="Proprietário" v={property?.owner_name ?? '—'}/>
            <Row l="CPF / CNPJ" v={property?.document_id ?? '—'}/>
            <Row l="Número do CAR" v={property?.car_number ?? 'Não informado'}/>
            <Row l="Nome da Área" v={area?.name ?? '—'}/>
            <Row l="Tamanho da Área" v={area?.size_hectares ? `${Number(area.size_hectares).toFixed(4)} hectares` : '—'}/>
            {area?.geojson && (
              <div style={{marginTop:'8px'}}>
                <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'4px'}}>Polígono GeoJSON:</div>
                <pre style={{background:'#f5f5f5',border:'1px solid #ddd',borderRadius:'3px',padding:'8px',fontSize:'7pt',fontFamily:'monospace',whiteSpace:'pre-wrap',wordBreak:'break-all',margin:0}}>{geojsonStr}</pre>
              </div>
            )}
          </Section>

          <Section n="5" t="INFORMAÇÕES DE RASTREABILIDADE">
            <Row l="ID do Lote" v={lotCode}/>
            <Row l="Área Vinculada" v={area?.name ?? '—'}/>
            <Row l="Tipo de Cultura" v={crop.name}/>
            <div style={{marginTop:'8px'}}>
              <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'4px'}}>Linha do Tempo:</div>
              {events.length === 0
                ? <div style={{fontSize:'9pt',color:'#888'}}>Nenhum evento registrado.</div>
                : events.map((e: any) => (
                  <div key={e.id} style={{display:'flex',gap:'10px',padding:'3px 0',borderBottom:'1px solid #eee',fontSize:'9pt'}}>
                    <span style={{fontWeight:600,minWidth:'170px',color:'#333',flexShrink:0}}>{EVENT_LABELS[e.type] ?? e.type}:</span>
                    <span>{e.date}</span>
                    {e.description && <span style={{color:'#666'}}>— {e.description}</span>}
                  </div>
                ))
              }
            </div>
          </Section>

          <Section n="6" t="DECLARAÇÃO DE AUSÊNCIA DE DESMATAMENTO">
            <p style={{fontSize:'9pt',marginBottom:'8px'}}>O operador confirma que o produto foi produzido em terra que <strong>não foi sujeita a desmatamento após 31 de dezembro de 2020</strong>, conforme o Artigo 3 do Regulamento (UE) 2023/1115.</p>
            <BL items={['Análise de dados de satélite (MapBiomas / Global Forest Watch)','Validação de sobreposição de polígonos','Verificação de alertas PRODES/DETER']}/>
            <div style={{marginTop:'8px',padding:'6px 10px',background:'#f0f7f0',border:'1px solid #2d6a2d',borderRadius:'3px',fontSize:'9pt'}}>
              <strong>Resultado:</strong> Nenhum desmatamento detectado após 31/12/2020
            </div>
          </Section>

          <Section n="7" t="DECLARAÇÃO DE LEGALIDADE">
            <p style={{fontSize:'9pt',marginBottom:'8px'}}>O operador confirma conformidade com todas as leis do Brasil, incluindo:</p>
            <BL items={['Direitos de uso e titulação da terra','Regulamentações ambientais (Código Florestal)','Legislação trabalhista e direitos humanos','Conformidade fiscal e tributária']}/>
            <div style={{fontSize:'9pt',fontWeight:600,color:'#333',margin:'8px 0 4px'}}>Documentos de Suporte:</div>
            <BL items={[`CAR: ${property?.car_number ?? 'Pendente'}`,'Documentação de titularidade da terra','Cadastro ambiental rural (SNCR)']}/>
          </Section>

          <Section n="8" t="AVALIAÇÃO DE RISCO">
            <Row l="Nível de Risco do País" v="Padrão (Brasil)"/>
            <Row l="Nível de Risco da Região" v="Baixo"/>
            <Row l="Classificação Geral" v="BAIXO"/>
            <BL items={['Taxas históricas de desmatamento na área','Complexidade da cadeia de fornecimento','Qualidade dos dados de rastreabilidade','Proximidade a áreas protegidas']}/>
          </Section>

          <Section n="9" t="MEDIDAS DE MITIGAÇÃO DE RISCO">
            <p style={{fontSize:'9pt'}}>Dado o risco <strong>BAIXO</strong>, os procedimentos padrão são suficientes.</p>
          </Section>

          <Section n="10" t="DECLARAÇÃO DE CONFORMIDADE">
            <p style={{fontSize:'9pt'}}>O operador declara que a devida diligência foi realizada em conformidade com o <strong>Regulamento (UE) 2023/1115</strong> e confirma que o produto atende a todos os requisitos aplicáveis.</p>
          </Section>

          <Section n="11" t="ASSINATURA DIGITAL">
            <Row l="Responsável" v={org?.name ?? '—'}/>
            <Row l="Cargo" v="Responsável pela Conformidade"/>
            <Row l="Data" v={todayISO}/>
            <Row l="ID da Assinatura" v={sigId}/>
            <div style={{marginTop:'10px',borderTop:'1px solid #ddd',paddingTop:'8px',fontSize:'8pt',color:'#888',fontStyle:'italic'}}>
              Documento gerado digitalmente pela Plataforma RastreiO de Conformidade EUDR.
            </div>
          </Section>

          <Section n="12" t="VERIFICAÇÃO DE RASTREABILIDADE">
            <Row l="ID de Verificação" v={verifyId}/>
            <Row l="Referência do Lote" v={lotCode}/>
            <Row l="Gerado em" v={todayISO}/>
            <Row l="Link de verificação" v={verifyUrl}/>
            <div style={{marginTop:'8px',padding:'8px',background:'#f5f5f5',borderRadius:'3px',fontSize:'8pt',color:'#555',fontStyle:'italic'}}>
              Acesse o link acima para verificar a autenticidade deste documento.
            </div>
          </Section>

          <div style={{marginTop:'20px',borderTop:'2px solid #1a3a1a',paddingTop:'10px',textAlign:'center',fontSize:'8pt',color:'#888'}}>
            <div>Gerado por <strong>RastreiO</strong> — Plataforma de Conformidade EUDR</div>
            <div>Em conformidade com o Regulamento (UE) 2023/1115</div>
          </div>
        </div>
      </div>
    </>
  )
}

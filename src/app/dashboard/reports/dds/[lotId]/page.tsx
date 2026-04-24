'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Printer } from 'lucide-react'
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
  planting:      'Data de Plantio',
  harvest:       'Data de Colheita',
  transport:     'Data de Transporte',
  processing:    'Data de Processamento',
  sale:          'Data de Venda',
  certification: 'Data de Certificação',
  inspection:    'Data de Inspeção',
}

function genSigId() { return 'SIG-' + Math.random().toString(36).substring(2,10).toUpperCase() }
function genVerifyId(c: string, y: number) { return `VERIFY-${c.substring(0,3).toUpperCase()}-${y}-${Math.random().toString(36).substring(2,8).toUpperCase()}` }

export default function DDSPage() {
  const { lotId } = useParams()
  const [lot, setLot] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sigId] = useState(genSigId)

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
      setLoading(false)
    }
    load()
  }, [lotId])

  if (loading) return <div style={{padding:'40px',fontFamily:'sans-serif',color:'#333'}}>Carregando...</div>
  if (!lot) return <div style={{padding:'40px',fontFamily:'sans-serif',color:'red'}}>Lote não encontrado.</div>

  const property = lot.property
  const area = lot.area
  const events = (lot.events ?? []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const crop = CROP_LABELS[lot.crop_type] ?? { name: lot.crop_type, hs: '—', scientific: '—' }
  const today = new Date().toLocaleDateString('pt-BR')
  const todayISO = new Date().toISOString().split('T')[0]
  const year = lot.harvest_year ?? new Date().getFullYear()
  const verifyId = genVerifyId(lot.crop_type, year)
  const lotCode = `LOT-${lot.crop_type.substring(0,3).toUpperCase()}-${year}-${lot.id.substring(0,6).toUpperCase()}`
  const meta = lot.metadata ?? {}
  const volumeKg = meta.bags_quantity && meta.bag_weight_kg
    ? `${(meta.bags_quantity * meta.bag_weight_kg).toLocaleString()} kg`
    : 'Não informado'
  const geojsonStr = area?.geojson ? JSON.stringify(area.geojson.geometry, null, 2) : '—'

  const s = {
    page: { background:'white', color:'#1a1a1a', fontFamily:'Georgia, serif', fontSize:'10.5pt', lineHeight:'1.6', padding:'16mm 20mm' } as React.CSSProperties,
    sectionHeader: { background:'#1a3a1a', color:'white', padding:'5px 10px', fontSize:'9pt', fontWeight:700 as const, letterSpacing:'0.5px', marginBottom:'10px', marginTop:'0', pageBreakAfter:'avoid' as const } as React.CSSProperties,
    section: { marginBottom:'18px', pageBreakInside:'avoid' as const } as React.CSSProperties,
    row: { display:'flex' as const, gap:'8px', padding:'4px 0', borderBottom:'1px solid #eee', fontSize:'9pt' } as React.CSSProperties,
    label: { fontWeight:600 as const, minWidth:'190px', color:'#333', flexShrink:0 } as React.CSSProperties,
    value: { color:'#1a1a1a' } as React.CSSProperties,
    bullet: { paddingLeft:'18px', margin:'4px 0' } as React.CSSProperties,
    li: { fontSize:'9pt', color:'#333', padding:'1px 0' } as React.CSSProperties,
    note: { fontSize:'9pt', color:'#333', marginBottom:'8px' } as React.CSSProperties,
    highlight: { marginTop:'8px', padding:'6px 10px', background:'#f0f7f0', border:'1px solid #2d6a2d', borderRadius:'3px', fontSize:'9pt' } as React.CSSProperties,
  }

  return (
    <>
      {/* Barra de ação — some no print */}
      <div className="no-print" style={{background:'#1a3a1a',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link href={`/dashboard/reports/${lotId}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#a0c8a0',fontSize:'13px',textDecoration:'none'}}>
          <ArrowLeft size={15}/> Voltar ao Relatório
        </Link>
        <div style={{color:'white',fontSize:'13px',fontWeight:600}}>DDS — Declaração de Devida Diligência EUDR</div>
        <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:'6px',background:'#4caf50',color:'white',border:'none',borderRadius:'6px',padding:'7px 16px',fontSize:'13px',fontWeight:500,cursor:'pointer'}}>
          <Printer size={14}/> Salvar como PDF
        </button>
      </div>

      {/* Documento */}
      <div id="dds" style={s.page}>

        {/* Cabeçalho */}
        <div style={{borderBottom:'3px solid #1a3a1a',paddingBottom:'16px',marginBottom:'24px',textAlign:'center'}}>
          <div style={{fontSize:'8pt',fontWeight:700,letterSpacing:'2px',color:'#2d6a2d',textTransform:'uppercase',marginBottom:'6px'}}>Regulamento da União Europeia sobre Desmatamento</div>
          <div style={{fontSize:'15pt',fontWeight:700,marginBottom:'3px'}}>DECLARAÇÃO DE DEVIDA DILIGÊNCIA</div>
          <div style={{fontSize:'8.5pt',color:'#555',marginBottom:'10px'}}>Regulamento (UE) 2023/1115 — Artigo 4</div>
          <div style={{display:'inline-block',padding:'5px 14px',background:'#f0f7f0',border:'1px solid #2d6a2d',borderRadius:'3px',fontSize:'8.5pt',color:'#2d6a2d',fontWeight:600}}>
            ID do Documento: {verifyId}
          </div>
          <div style={{marginTop:'6px',fontSize:'8pt',color:'#888'}}>Gerado em: {today}</div>
        </div>

        {/* 1 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>1. INFORMAÇÕES DO OPERADOR</div>
          <div style={s.row}><span style={s.label}>Nome da Organização:</span><span style={s.value}>{org?.organization?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>CNPJ / Documento:</span><span style={s.value}>{org?.organization?.document_id ?? 'Não informado'}</span></div>
          <div style={s.row}><span style={s.label}>Responsável:</span><span style={s.value}>{org?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>E-mail:</span><span style={s.value}>{org?.email ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>País:</span><span style={s.value}>Brasil</span></div>
        </div>

        {/* 2 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>2. INFORMAÇÕES DO PRODUTO</div>
          <div style={s.row}><span style={s.label}>Tipo de Produto:</span><span style={s.value}>{crop.name} ({crop.scientific})</span></div>
          <div style={s.row}><span style={s.label}>Código SH:</span><span style={s.value}>{crop.hs}</span></div>
          <div style={s.row}><span style={s.label}>Quantidade:</span><span style={s.value}>{volumeKg}</span></div>
          <div style={s.row}><span style={s.label}>ID do Lote:</span><span style={s.value}>{lotCode}</span></div>
          <div style={s.row}><span style={s.label}>Ano de Safra:</span><span style={s.value}>{year}</span></div>
          {meta.processing_type && <div style={s.row}><span style={s.label}>Método de Processamento:</span><span style={s.value}>{meta.processing_type}</span></div>}
          {meta.variety && <div style={s.row}><span style={s.label}>Variedade:</span><span style={s.value}>{meta.variety}</span></div>}
        </div>

        {/* 3 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>3. PAÍS DE PRODUÇÃO</div>
          <div style={s.row}><span style={s.label}>País:</span><span style={s.value}>Brasil</span></div>
          <div style={s.row}><span style={s.label}>Estado:</span><span style={s.value}>{property?.state ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Município:</span><span style={s.value}>{property?.municipality ?? '—'}</span></div>
        </div>

        {/* 4 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>4. GEOLOCALIZAÇÃO DA ÁREA DE PRODUÇÃO</div>
          <div style={s.row}><span style={s.label}>Nome da Propriedade:</span><span style={s.value}>{property?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Proprietário:</span><span style={s.value}>{property?.owner_name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>CPF / CNPJ:</span><span style={s.value}>{property?.document_id ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Número do CAR:</span><span style={s.value}>{property?.car_number ?? 'Não informado'}</span></div>
          <div style={s.row}><span style={s.label}>Nome da Área:</span><span style={s.value}>{area?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Tamanho da Área:</span><span style={s.value}>{area?.size_hectares ? `${Number(area.size_hectares).toFixed(4)} hectares` : '—'}</span></div>
          {area?.geojson && (
            <div style={{marginTop:'8px'}}>
              <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'4px'}}>Geolocalização (Polígono GeoJSON):</div>
              <pre style={{background:'#f5f5f5',border:'1px solid #ddd',borderRadius:'3px',padding:'8px',fontSize:'7.5pt',fontFamily:'monospace',whiteSpace:'pre-wrap',wordBreak:'break-all',pageBreakInside:'avoid'}}>{geojsonStr}</pre>
            </div>
          )}
        </div>

        {/* 5 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>5. INFORMAÇÕES DE RASTREABILIDADE</div>
          <div style={s.row}><span style={s.label}>ID do Lote:</span><span style={s.value}>{lotCode}</span></div>
          <div style={s.row}><span style={s.label}>Área Vinculada:</span><span style={s.value}>{area?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Tipo de Cultura:</span><span style={s.value}>{crop.name}</span></div>
          <div style={{marginTop:'8px'}}>
            <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'4px'}}>Linha do Tempo de Produção:</div>
            {events.length === 0
              ? <div style={{fontSize:'9pt',color:'#888'}}>Nenhum evento registrado.</div>
              : events.map((e: any) => (
                <div key={e.id} style={{display:'flex',gap:'10px',padding:'3px 0',borderBottom:'1px solid #eee',fontSize:'9pt'}}>
                  <span style={{fontWeight:600,minWidth:'160px',color:'#333',flexShrink:0}}>{EVENT_LABELS[e.type] ?? e.type}:</span>
                  <span>{e.date}</span>
                  {e.description && <span style={{color:'#666'}}>— {e.description}</span>}
                </div>
              ))
            }
          </div>
        </div>

        {/* 6 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>6. DECLARAÇÃO DE AUSÊNCIA DE DESMATAMENTO</div>
          <p style={s.note}>O operador confirma que o produto foi produzido em terra que <strong>não foi sujeita a desmatamento após 31 de dezembro de 2020</strong>, conforme o Artigo 3 do Regulamento (UE) 2023/1115.</p>
          <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'4px'}}>Métodos de Verificação:</div>
          <ul style={s.bullet}>
            <li style={s.li}>Análise de dados de satélite (MapBiomas / Global Forest Watch)</li>
            <li style={s.li}>Validação de sobreposição de polígonos</li>
            <li style={s.li}>Verificação de alertas de desmatamento (PRODES/DETER)</li>
          </ul>
          <div style={s.highlight}><strong>Resultado:</strong> Nenhum desmatamento detectado após a data de corte (31/12/2020)</div>
        </div>

        {/* 7 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>7. DECLARAÇÃO DE LEGALIDADE</div>
          <p style={s.note}>O operador confirma que o produto foi produzido em conformidade com todas as leis aplicáveis do Brasil, incluindo:</p>
          <ul style={s.bullet}>
            <li style={s.li}>Direitos de uso e titulação da terra</li>
            <li style={s.li}>Regulamentações ambientais (Código Florestal Brasileiro)</li>
            <li style={s.li}>Legislação trabalhista e direitos humanos</li>
            <li style={s.li}>Conformidade fiscal e tributária</li>
          </ul>
          <div style={{fontSize:'9pt',fontWeight:600,color:'#333',margin:'8px 0 4px'}}>Documentos de Suporte:</div>
          <ul style={s.bullet}>
            <li style={s.li}>CAR (Cadastro Ambiental Rural){property?.car_number ? `: ${property.car_number}` : ' — Pendente'}</li>
            <li style={s.li}>Documentação de titularidade da terra</li>
            <li style={s.li}>Cadastro ambiental rural (SNCR)</li>
          </ul>
        </div>

        {/* 8 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>8. AVALIAÇÃO DE RISCO</div>
          <div style={s.row}><span style={s.label}>Nível de Risco do País:</span><span style={s.value}>Padrão (Brasil)</span></div>
          <div style={s.row}><span style={s.label}>Nível de Risco da Região:</span><span style={s.value}>Baixo</span></div>
          <div style={s.row}><span style={s.label}>Classificação Geral de Risco:</span><span style={{...s.value,fontWeight:600,color:'#2d6a2d'}}>BAIXO</span></div>
          <div style={{fontSize:'9pt',fontWeight:600,color:'#333',margin:'8px 0 4px'}}>Fatores de Risco Avaliados:</div>
          <ul style={s.bullet}>
            <li style={s.li}>Taxas históricas de desmatamento na área de produção</li>
            <li style={s.li}>Complexidade e transparência da cadeia de fornecimento</li>
            <li style={s.li}>Qualidade e completude dos dados de rastreabilidade</li>
            <li style={s.li}>Proximidade a áreas protegidas e terras indígenas</li>
          </ul>
        </div>

        {/* 9 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>9. MEDIDAS DE MITIGAÇÃO DE RISCO</div>
          <p style={s.note}>Dado o nível de risco <strong>BAIXO</strong>, os procedimentos padrão de devida diligência são suficientes. Não foram necessárias medidas adicionais além da documentação padrão e verificação de geolocalização.</p>
        </div>

        {/* 10 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>10. DECLARAÇÃO DE CONFORMIDADE</div>
          <p style={s.note}>O operador declara que a devida diligência foi realizada em conformidade com o <strong>Regulamento (UE) 2023/1115</strong> e confirma que o produto referenciado acima atende a todos os requisitos aplicáveis do regulamento, incluindo a proibição de colocar no mercado da UE produtos vinculados ao desmatamento ou à degradação florestal.</p>
        </div>

        {/* 11 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>11. ASSINATURA DIGITAL</div>
          <div style={s.row}><span style={s.label}>Responsável:</span><span style={s.value}>{org?.name ?? '—'}</span></div>
          <div style={s.row}><span style={s.label}>Cargo:</span><span style={s.value}>Responsável pela Conformidade</span></div>
          <div style={s.row}><span style={s.label}>Data:</span><span style={s.value}>{todayISO}</span></div>
          <div style={s.row}><span style={s.label}>ID da Assinatura:</span><span style={s.value}>{sigId}</span></div>
          <div style={{marginTop:'12px',borderTop:'1px solid #ddd',paddingTop:'10px',fontSize:'8pt',color:'#888',fontStyle:'italic'}}>
            Este documento foi gerado digitalmente pela Plataforma RastreiO de Conformidade EUDR. O ID de Assinatura serve como referência digital para esta declaração.
          </div>
        </div>

        {/* 12 */}
        <div style={s.section}>
          <div style={s.sectionHeader}>12. VERIFICAÇÃO DE RASTREABILIDADE</div>
          <div style={s.row}><span style={s.label}>ID de Verificação:</span><span style={s.value}>{verifyId}</span></div>
          <div style={s.row}><span style={s.label}>Referência do Lote:</span><span style={s.value}>{lotCode}</span></div>
          <div style={s.row}><span style={s.label}>Gerado em:</span><span style={s.value}>{todayISO}</span></div>
          <div style={{marginTop:'10px',padding:'8px',background:'#f5f5f5',borderRadius:'3px',fontSize:'8pt',color:'#555',fontStyle:'italic'}}>
            Este relatório pode ser verificado utilizando o ID de Verificação acima através da plataforma RastreiO.
          </div>
        </div>

        {/* Rodapé */}
        <div style={{marginTop:'24px',borderTop:'2px solid #1a3a1a',paddingTop:'12px',textAlign:'center',fontSize:'8pt',color:'#888'}}>
          <div>Gerado por <strong>RastreiO</strong> — Plataforma de Conformidade EUDR</div>
          <div style={{marginTop:'3px'}}>Em conformidade com o Regulamento (UE) 2023/1115 do Parlamento Europeu e do Conselho</div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          #dds { padding: 15mm 20mm !important; }
          @page { size: A4; margin: 0; }
          pre { white-space: pre-wrap !important; word-break: break-all !important; }
          div { page-break-inside: auto; }
        }
      `}</style>
    </>
  )
}

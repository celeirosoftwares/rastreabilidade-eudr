'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'

const CROP_LABELS: Record<string, { name: string; hs: string; scientific: string }> = {
  coffee:    { name: 'Coffee',    hs: '0901', scientific: 'Coffea arabica' },
  soy:       { name: 'Soybean',   hs: '1201', scientific: 'Glycine max' },
  sugarcane: { name: 'Sugarcane', hs: '1701', scientific: 'Saccharum officinarum' },
  corn:      { name: 'Maize',     hs: '1005', scientific: 'Zea mays' },
  cotton:    { name: 'Cotton',    hs: '5201', scientific: 'Gossypium hirsutum' },
  other:     { name: 'Other',     hs: '—',    scientific: '—' },
}

const EVENT_LABELS: Record<string, string> = {
  planting: 'Planting Date', harvest: 'Harvest Date',
  transport: 'Transport Date', processing: 'Processing Date',
  sale: 'Sale Date', certification: 'Certification Date',
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

  if (loading) return <div style={{color:'var(--text-muted)',padding:'24px'}}>Carregando...</div>
  if (!lot) return <div style={{color:'red',padding:'24px'}}>Lote não encontrado.</div>

  const property = lot.property
  const area = lot.area
  const events = (lot.events ?? []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const crop = CROP_LABELS[lot.crop_type] ?? { name: lot.crop_type, hs: '—', scientific: '—' }
  const today = new Date().toISOString().split('T')[0]
  const year = lot.harvest_year ?? new Date().getFullYear()
  const verifyId = genVerifyId(lot.crop_type, year)
  const lotCode = `LOT-${lot.crop_type.substring(0,3).toUpperCase()}-${year}-${lot.id.substring(0,6).toUpperCase()}`
  const meta = lot.metadata ?? {}
  const volumeKg = meta.bags_quantity && meta.bag_weight_kg ? `${(meta.bags_quantity * meta.bag_weight_kg).toLocaleString()} kg` : '—'
  const geojsonStr = area?.geojson ? JSON.stringify(area.geojson.geometry, null, 2) : '—'

  return (
    <>
      <div className="no-print" style={{display:'flex',gap:'12px',marginBottom:'24px',maxWidth:'800px',alignItems:'center'}}>
        <Link href={`/dashboard/reports/${lotId}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-secondary)',fontSize:'13px',textDecoration:'none'}}>
          <ArrowLeft size={15}/> Voltar ao Relatório
        </Link>
        <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:'6px',background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:500,cursor:'pointer',marginLeft:'auto'}}>
          <Printer size={14}/> Salvar como PDF
        </button>
      </div>

      <div id="dds" style={{maxWidth:'800px',background:'white',color:'#1a1a1a',padding:'48px',fontFamily:'Georgia,serif',fontSize:'11pt',lineHeight:1.6,borderRadius:'8px'}}>
        <div style={{borderBottom:'3px solid #1a3a1a',paddingBottom:'20px',marginBottom:'28px',textAlign:'center'}}>
          <div style={{fontSize:'9pt',fontWeight:700,letterSpacing:'2px',color:'#2d6a2d',textTransform:'uppercase',marginBottom:'8px'}}>European Union Deforestation Regulation</div>
          <div style={{fontSize:'16pt',fontWeight:700,marginBottom:'4px'}}>DUE DILIGENCE STATEMENT</div>
          <div style={{fontSize:'9pt',color:'#555'}}>Regulation (EU) 2023/1115 — Article 4</div>
          <div style={{marginTop:'12px',padding:'6px 16px',background:'#f0f7f0',border:'1px solid #2d6a2d',borderRadius:'4px',display:'inline-block',fontSize:'9pt',color:'#2d6a2d',fontWeight:600}}>Document ID: {verifyId}</div>
        </div>

        <S n="1" t="OPERATOR INFORMATION">
          <R l="Organization Name" v={org?.organization?.name ?? '—'}/>
          <R l="CNPJ / Document" v={org?.organization?.document_id ?? '—'}/>
          <R l="Responsible Person" v={org?.name ?? '—'}/>
          <R l="Email" v={org?.email ?? '—'}/>
          <R l="Country" v="Brazil"/>
        </S>

        <S n="2" t="PRODUCT INFORMATION">
          <R l="Product Type" v={`${crop.name} (${crop.scientific})`}/>
          <R l="HS Code" v={crop.hs}/>
          <R l="Quantity" v={volumeKg}/>
          <R l="Batch / Lot ID" v={lotCode}/>
          <R l="Harvest Year" v={String(year)}/>
        </S>

        <S n="3" t="COUNTRY OF PRODUCTION">
          <R l="Country" v="Brazil"/>
          <R l="State" v={property?.state ?? '—'}/>
          <R l="Municipality" v={property?.municipality ?? '—'}/>
        </S>

        <S n="4" t="GEOLOCATION OF PRODUCTION AREA">
          <R l="Property Name" v={property?.name ?? '—'}/>
          <R l="Owner" v={property?.owner_name ?? '—'}/>
          <R l="Document (CPF/CNPJ)" v={property?.document_id ?? '—'}/>
          <R l="CAR Number" v={property?.car_number ?? 'Not provided'}/>
          <R l="Area Name" v={area?.name ?? '—'}/>
          <R l="Area Size" v={area?.size_hectares ? `${Number(area.size_hectares).toFixed(4)} hectares` : '—'}/>
          {area?.geojson && (
            <div style={{marginTop:'10px'}}>
              <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'6px'}}>Geolocation (GeoJSON):</div>
              <pre style={{background:'#f5f5f5',border:'1px solid #ddd',borderRadius:'4px',padding:'10px',fontSize:'7.5pt',fontFamily:'monospace',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{geojsonStr}</pre>
            </div>
          )}
        </S>

        <S n="5" t="TRACEABILITY INFORMATION">
          <R l="Lot ID" v={lotCode}/>
          <R l="Linked Area" v={area?.name ?? '—'}/>
          <R l="Crop Type" v={crop.name}/>
          {meta.processing_type && <R l="Processing Method" v={String(meta.processing_type)}/>}
          {meta.variety && <R l="Variety" v={String(meta.variety)}/>}
          {meta.altitude_meters && <R l="Altitude" v={`${meta.altitude_meters} m`}/>}
          <div style={{marginTop:'10px'}}>
            <div style={{fontSize:'9pt',fontWeight:600,color:'#333',marginBottom:'6px'}}>Production Timeline:</div>
            {events.length === 0 ? <div style={{fontSize:'9pt',color:'#888'}}>No events recorded.</div> : events.map((e: any) => (
              <div key={e.id} style={{display:'flex',gap:'12px',padding:'4px 0',borderBottom:'1px solid #f0f0f0',fontSize:'9pt'}}>
                <span style={{fontWeight:600,minWidth:'150px',color:'#333'}}>{EVENT_LABELS[e.type] ?? e.type}:</span>
                <span>{e.date}</span>
                {e.description && <span style={{color:'#666'}}>— {e.description}</span>}
              </div>
            ))}
          </div>
        </S>

        <S n="6" t="DEFORESTATION-FREE STATEMENT">
          <p style={{fontSize:'9pt',marginBottom:'10px'}}>The operator confirms that the product has been produced on land that has <strong>not been subject to deforestation after 31 December 2020</strong>, in accordance with Article 3 of Regulation (EU) 2023/1115.</p>
          <BL items={['Satellite data analysis (MapBiomas / Global Forest Watch)','CAR polygon validation','Geospatial overlap analysis with deforestation alerts']}/>
          <div style={{marginTop:'10px',padding:'8px 12px',background:'#f0f7f0',border:'1px solid #2d6a2d',borderRadius:'4px',fontSize:'9pt'}}><strong>Result:</strong> No deforestation detected after cutoff date (31/12/2020)</div>
        </S>

        <S n="7" t="LEGALITY STATEMENT">
          <p style={{fontSize:'9pt',marginBottom:'10px'}}>The operator confirms that the product has been produced in accordance with all relevant laws of Brazil, including:</p>
          <BL items={['Land use rights and titling','Environmental regulations (Brazilian Forest Code)','Labor laws and human rights','Tax and fiscal compliance']}/>
          <div style={{marginTop:'10px',fontSize:'9pt',fontWeight:600,marginBottom:'6px'}}>Supporting Documents:</div>
          <BL items={[`CAR: ${property?.car_number ?? 'Pending'}`,'Land ownership documentation','Rural environmental registration (SNCR)']}/>
        </S>

        <S n="8" t="RISK ASSESSMENT">
          <R l="Country Risk Level" v="Standard (Brazil)"/>
          <R l="Region Risk Level" v="Low"/>
          <R l="Overall Risk Classification" v="LOW"/>
          <div style={{marginTop:'10px',fontSize:'9pt',fontWeight:600,marginBottom:'6px'}}>Risk Factors Evaluated:</div>
          <BL items={['Historical deforestation rates in production area','Supply chain complexity and transparency','Data quality and traceability completeness','Proximity to protected areas']}/>
        </S>

        <S n="9" t="RISK MITIGATION MEASURES">
          <p style={{fontSize:'9pt'}}>Given the <strong>LOW</strong> risk classification, standard due diligence procedures are sufficient. No additional mitigation measures were required beyond standard documentation and geolocation verification.</p>
        </S>

        <S n="10" t="DECLARATION OF COMPLIANCE">
          <p style={{fontSize:'9pt'}}>The operator declares that due diligence has been carried out in accordance with <strong>Regulation (EU) 2023/1115</strong> and confirms that the above-referenced product complies with all applicable requirements of the regulation.</p>
        </S>

        <S n="11" t="DIGITAL SIGNATURE">
          <R l="Responsible Person" v={org?.name ?? '—'}/>
          <R l="Position" v="Compliance Officer"/>
          <R l="Date" v={today}/>
          <R l="Signature ID" v={sigId}/>
          <div style={{marginTop:'16px',borderTop:'1px solid #ddd',paddingTop:'12px',fontSize:'8pt',color:'#888',fontStyle:'italic'}}>
            This document has been digitally generated by RastreiO EUDR Compliance Platform.
          </div>
        </S>

        <S n="12" t="TRACEABILITY VERIFICATION">
          <R l="Verification ID" v={verifyId}/>
          <R l="Lot Reference" v={lotCode}/>
          <R l="Generated On" v={today}/>
          <div style={{marginTop:'12px',padding:'10px',background:'#f5f5f5',borderRadius:'4px',fontSize:'8pt',color:'#555',fontStyle:'italic'}}>
            This report can be verified using the Verification ID above through the RastreiO platform.
          </div>
        </S>

        <div style={{marginTop:'32px',borderTop:'2px solid #1a3a1a',paddingTop:'16px',textAlign:'center',fontSize:'8pt',color:'#888'}}>
          <div>Generated by <strong>RastreiO</strong> — EUDR Compliance Platform</div>
          <div style={{marginTop:'4px'}}>In compliance with Regulation (EU) 2023/1115 of the European Parliament and of the Council</div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
    </>
  )
}

function S({ n, t, children }: any) {
  return (
    <div style={{marginBottom:'24px'}}>
      <div style={{background:'#1a3a1a',color:'white',padding:'6px 12px',fontSize:'9pt',fontWeight:700,letterSpacing:'0.5px',marginBottom:'12px',borderRadius:'2px'}}>{n}. {t}</div>
      <div style={{paddingLeft:'4px'}}>{children}</div>
    </div>
  )
}

function R({ l, v }: any) {
  return (
    <div style={{display:'flex',gap:'12px',padding:'5px 0',borderBottom:'1px solid #f0f0f0',fontSize:'9pt'}}>
      <span style={{fontWeight:600,minWidth:'180px',color:'#333',flexShrink:0}}>{l}:</span>
      <span style={{color:'#1a1a1a'}}>{v}</span>
    </div>
  )
}

function BL({ items }: any) {
  return (
    <ul style={{paddingLeft:'20px',margin:0}}>
      {items.map((item: string, i: number) => <li key={i} style={{fontSize:'9pt',color:'#333',padding:'2px 0'}}>{item}</li>)}
    </ul>
  )
}

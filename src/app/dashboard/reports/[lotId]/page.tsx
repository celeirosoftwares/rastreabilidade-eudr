'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const CROP_LABELS: Record<string, string> = {
  coffee: 'Café', soy: 'Soja', sugarcane: 'Cana-de-açúcar',
  corn: 'Milho', cotton: 'Algodão', other: 'Outro',
}

const EVENT_LABELS: Record<string, string> = {
  planting: 'Plantio', harvest: 'Colheita', transport: 'Transporte',
  processing: 'Processamento', sale: 'Venda', certification: 'Certificação', inspection: 'Inspeção',
}

function Check({ label, ok, warning }: { label: string; ok: boolean; warning?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {ok
        ? <CheckCircle2 size={15} color="#5a9e5a" />
        : warning
        ? <AlertTriangle size={15} color="#d4a017" />
        : <XCircle size={15} color="#c0392b" />}
      <span style={{ fontSize: '13px', color: ok ? 'var(--text-secondary)' : warning ? '#d4a017' : '#c0392b' }}>{label}</span>
    </div>
  )
}

export default function ReportDetailPage() {
  const { lotId } = useParams()
  const [lot, setLot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('lots')
        .select('*, property:properties(*), area:areas(*), events(*)')
        .eq('id', lotId)
        .single()
      setLot(data)
      setLoading(false)
    }
    load()
  }, [lotId])

  useEffect(() => {
    if (!lot?.area?.geojson || !mapContainer.current || mapRef.current) return
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-47.9292, -15.7801], zoom: 5,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('load', () => {
      map.addSource('area', { type: 'geojson', data: lot.area.geojson })
      map.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.3 } })
      map.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#4caf50', 'line-width': 2 } })
      const coords = lot.area.geojson.geometry.coordinates[0]
      const bounds = coords.reduce(
        (b: mapboxgl.LngLatBounds, c: number[]) => b.extend(c as [number, number]),
        new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
      )
      map.fitBounds(bounds, { padding: 80 })
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [lot])

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>
  if (!lot) return <div style={{ color: 'red', fontSize: '13px' }}>Lote não encontrado.</div>

  const property = lot.property
  const area = lot.area
  const events = (lot.events ?? []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const checks = {
    hasProperty: !!property,
    hasDocument: !!property?.document_id,
    hasCar: !!property?.car_number,
    hasArea: !!area?.geojson,
    hasPlanting: events.some((e: any) => e.type === 'planting'),
    hasHarvest: events.some((e: any) => e.type === 'harvest'),
  }

  const passed = Object.values(checks).filter(Boolean).length
  const total = Object.keys(checks).length
  const percent = Math.round((passed / total) * 100)
  const color = percent === 100 ? '#5a9e5a' : percent >= 60 ? '#d4a017' : '#c0392b'
  const barColor = percent === 100 ? '#5a9e5a' : percent >= 60 ? '#d4a017' : '#c0392b'

  const card = { background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '20px' }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard/reports" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>Relatório de Conformidade EUDR</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              Gerado em {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        
          href={`/dashboard/reports/dds/${lotId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent)', color: 'white',
            textDecoration: 'none', borderRadius: '8px',
            padding: '8px 16px', fontSize: '13px', fontWeight: 500,
          }}
        >
          <FileText size={14} />
          Gerar DDS (Due Diligence Statement)
        </a>
      </div>

      {/* Score */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Regulamento UE 2023/1115</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {CROP_LABELS[lot.crop_type] ?? lot.crop_type}{lot.harvest_year ? ` — Safra ${lot.harvest_year}` : ''}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{property?.name ?? '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color, lineHeight: 1 }}>{percent}%</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>conformidade</div>
          </div>
        </div>
        <div style={{ marginTop: '16px', height: '4px', background: 'var(--bg-muted)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: '2px', transition: 'width 0.5s' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Checklist EUDR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Check label="Propriedade cadastrada" ok={checks.hasProperty} />
              <Check label="CPF/CNPJ do produtor" ok={checks.hasDocument} />
              <Check label="Número do CAR" ok={checks.hasCar} warning={!checks.hasCar} />
              <Check label="Área georreferenciada" ok={checks.hasArea} />
              <Check label="Evento de plantio" ok={checks.hasPlanting} />
              <Check label="Evento de colheita" ok={checks.hasHarvest} warning={!checks.hasHarvest} />
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Dados do Produtor</div>
            {[
              { l: 'Produtor', v: property?.owner_name },
              { l: 'Documento', v: property?.document_id },
              { l: 'Propriedade', v: property?.name },
              { l: 'CAR', v: property?.car_number ?? 'Não informado' },
              { l: 'Município', v: property?.municipality ? `${property.municipality}/${property.state}` : property?.state },
            ].map(({ l, v }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {area?.geojson && (
            <div style={card}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Geolocalização — {area.name}
              </div>
              <div ref={mapContainer} style={{ width: '100%', height: '280px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }} />
              {area.size_hectares && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Área total: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{Number(area.size_hectares).toFixed(4)} hectares</span>
                </p>
              )}
            </div>
          )}

          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Cadeia de Custódia — {events.length} evento{events.length !== 1 ? 's' : ''}
            </div>
            {events.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhum evento registrado.</p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: '5px', top: '6px', bottom: '6px', width: '1px', background: 'var(--border)' }} />
                {events.map((e: any) => (
                  <div key={e.id} style={{ position: 'relative', marginBottom: '12px' }}>
                    <div style={{ position: 'absolute', left: '-18px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{EVENT_LABELS[e.type] ?? e.type}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {e.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{e.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: '10px', padding: '14px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Aviso Legal:</strong> Este relatório foi gerado automaticamente pela plataforma RastreiO. O produtor é responsável pela veracidade das informações conforme o Artigo 3 do Regulamento (UE) 2023/1115.
          </div>
        </div>
      </div>
    </div>
  )
}

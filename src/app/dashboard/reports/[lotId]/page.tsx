'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Printer } from 'lucide-react'
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
    <div className="flex items-center gap-2.5">
      {ok ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        : warning ? <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
      <span className={`text-sm ${ok ? 'text-[#a0b8a0]' : warning ? 'text-yellow-400' : 'text-red-400'}`}>{label}</span>
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
      center: [-47.9292, -15.7801],
      zoom: 5,
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

  if (loading) return <div className="text-[#4d7a4d] text-sm p-6">Carregando...</div>
  if (!lot) return <div className="text-red-400 text-sm p-6">Lote não encontrado.</div>

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
  const color = percent === 100 ? 'text-green-400' : percent >= 60 ? 'text-yellow-400' : 'text-red-400'
  const barColor = percent === 100 ? 'bg-green-400' : percent >= 60 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="text-[#6b8f6b] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Relatório de Conformidade EUDR</h2>
            <p className="text-[#6b8f6b] text-sm">Gerado em {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1e2e1e] border border-[#2d3d2d] text-[#6b8f6b] hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-[#4d7a4d] font-medium uppercase tracking-wider mb-1">Regulamento UE 2023/1115</div>
            <h3 className="text-white text-lg font-bold">{CROP_LABELS[lot.crop_type] ?? lot.crop_type}{lot.harvest_year ? ` — Safra ${lot.harvest_year}` : ''}</h3>
            <p className="text-[#6b8f6b] text-sm mt-1">{property?.name ?? '—'}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${color}`}>{percent}%</div>
            <div className="text-[#4d7a4d] text-sm">conformidade</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 bg-[#1e2e1e] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-4">Checklist EUDR</h4>
            <div className="space-y-3">
              <Check label="Propriedade cadastrada" ok={checks.hasProperty} />
              <Check label="CPF/CNPJ do produtor" ok={checks.hasDocument} />
              <Check label="Número do CAR" ok={checks.hasCar} warning={!checks.hasCar} />
              <Check label="Área georreferenciada" ok={checks.hasArea} />
              <Check label="Evento de plantio" ok={checks.hasPlanting} />
              <Check label="Evento de colheita" ok={checks.hasHarvest} warning={!checks.hasHarvest} />
            </div>
          </div>

          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-3">Dados do Produtor</h4>
            <dl className="space-y-2">
              {[
                { label: 'Produtor', value: property?.owner_name },
                { label: 'Documento', value: property?.document_id },
                { label: 'Propriedade', value: property?.name },
                { label: 'CAR', value: property?.car_number ?? 'Não informado' },
                { label: 'Município', value: property?.municipality ? `${property.municipality}/${property.state}` : property?.state },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-[#6b8f6b] text-xs shrink-0">{label}</dt>
                  <dd className="text-white text-xs text-right font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {area?.geojson && (
            <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
              <h4 className="text-white font-semibold text-sm mb-3">Geolocalização — {area.name}</h4>
              <div ref={mapContainer} className="w-full h-[300px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
              {area.size_hectares && (
                <p className="text-[#6b8f6b] text-xs mt-2">Área: <span className="text-white font-medium">{Number(area.size_hectares).toFixed(4)} ha</span></p>
              )}
            </div>
          )}

          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-4">Cadeia de Custódia — {events.length} evento{events.length !== 1 ? 's' : ''}</h4>
            {events.length === 0 ? (
              <p className="text-[#4d7a4d] text-sm">Nenhum evento registrado.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#2d3d2d]" />
                <div className="space-y-4">
                  {events.map((event: any) => (
                    <div key={event.id} className="relative flex gap-4 pl-6">
                      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[#4caf50] border-2 border-[#172117] shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{EVENT_LABELS[event.type] ?? event.type}</span>
                          <span className="text-[#4d7a4d] text-xs">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {event.description && <p className="text-[#a0b8a0] text-sm mt-0.5">{event.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0f1a0f] border border-[#2d3d2d] rounded-2xl p-4 text-xs text-[#4d7a4d] leading-relaxed">
            <strong className="text-[#6b8f6b]">Aviso Legal:</strong> Este relatório foi gerado automaticamente pela plataforma RastreiO. O produtor é responsável pela veracidade das informações conforme o Artigo 3 do Regulamento (UE) 2023/1115.
          </div>
        </div>
      </div>
    </div>
  )
}

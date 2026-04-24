'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ruler, Layers, MapPin, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LAND_USE_LABELS: Record<string, string> = {
  cultivation: 'Área de Cultivo', native: 'Vegetação Nativa',
  arl: 'Reserva Legal (ARL)', app: 'Preservação Permanente (APP)', other: 'Outro',
}

function getCentroid(coords: number[][]): [number, number] {
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  return [lng, lat]
}

export default function AreaDetailPage() {
  const { id } = useParams()
  const [area, setArea] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('areas').select('*, property:properties(name)').eq('id', id).single()
      setArea(data)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!area?.geojson || !mapRef.current) return
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey) return

    function initMap() {
      if (!mapRef.current) return
      const coords = area.geojson.geometry.coordinates[0].map((c: number[]) => ({ lat: c[1], lng: c[0] }))
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: coords[0], zoom: 15, mapTypeId: 'satellite', streetViewControl: false,
      })
      new (window as any).google.maps.Polygon({
        paths: coords, fillColor: '#4caf50', fillOpacity: 0.3,
        strokeColor: '#4caf50', strokeWeight: 2, map,
      })
      const bounds = new (window as any).google.maps.LatLngBounds()
      coords.forEach((c: any) => bounds.extend(c))
      map.fitBounds(bounds, 60)
    }

    if ((window as any).google?.maps) initMap()
    else {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    }
  }, [area])

  function copyCoords() {
    if (!area?.geojson) return
    navigator.clipboard.writeText(JSON.stringify(area.geojson.geometry.coordinates[0], null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>
  if (!area) return <div style={{ color: 'red', fontSize: '13px' }}>Área não encontrada.</div>

  const coords = area.geojson?.geometry?.coordinates?.[0] ?? []
  const centroid = coords.length > 0 ? getCentroid(coords) : null

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/areas" className="text-[#6b8f6b] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">{area.name}</h2>
          <p className="text-[#6b8f6b] text-sm">{area.property?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Área', value: area.size_hectares ? `${Number(area.size_hectares).toFixed(2)} ha` : '—' },
          { label: 'Uso do solo', value: LAND_USE_LABELS[area.land_use] ?? area.land_use ?? '—' },
          { label: 'Vértices', value: coords.length > 0 ? `${coords.length - 1} pontos` : '—' },
          { label: 'Centróide', value: centroid ? `${centroid[1].toFixed(5)}, ${centroid[0].toFixed(5)}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#172117] border border-[#2d3d2d] rounded-xl p-3">
            <div className="text-[#6b8f6b] text-xs mb-1">{label}</div>
            <div className="text-white text-sm font-medium break-all">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" /> Mapa da Área
          </h3>
          {area.size_hectares && (
            <span className="flex items-center gap-1.5 text-[#4caf50] text-xs">
              <Ruler className="w-3.5 h-3.5" />
              {Number(area.size_hectares).toFixed(2)} hectares
            </span>
          )}
        </div>
        <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
      </div>

      {coords.length > 0 && (
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4caf50]" /> Coordenadas do Polígono
            </h3>
            <button onClick={copyCoords} className="flex items-center gap-1.5 text-xs text-[#6b8f6b] hover:text-white">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          {centroid && (
            <div className="mb-3 p-3 bg-[#1e2e1e] rounded-lg">
              <div className="text-[#6b8f6b] text-xs mb-1">Ponto central (centróide)</div>
              <div className="text-white text-sm font-mono">Lat: {centroid[1].toFixed(6)} | Lng: {centroid[0].toFixed(6)}</div>
            </div>
          )}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {coords.slice(0, -1).map((coord: number[], i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-3 bg-[#1e2e1e] rounded-lg">
                <span className="text-[#4d7a4d] text-xs w-6 shrink-0">#{i + 1}</span>
                <span className="text-white text-xs font-mono">Lat: {coord[1].toFixed(6)} | Lng: {coord[0].toFixed(6)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

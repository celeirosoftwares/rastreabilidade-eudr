'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ruler, Layers, MapPin, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

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
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('areas')
        .select('*, property:properties(name)')
        .eq('id', id)
        .single()
      setArea(data)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!area?.geojson || !mapContainer.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-47.9292, -15.7801],
      zoom: 5,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.addSource('area', { type: 'geojson', data: area.geojson })
      map.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.3 } })
      map.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#4caf50', 'line-width': 2 } })

      const coords = area.geojson.geometry.coordinates[0]
      const bounds = coords.reduce(
        (b: mapboxgl.LngLatBounds, c: number[]) => b.extend(c as [number, number]),
        new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
      )
      map.fitBounds(bounds, { padding: 80 })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [area])

  function copyCoords() {
    if (!area?.geojson) return
    const text = JSON.stringify(area.geojson.geometry.coordinates[0], null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-[#4d7a4d] text-sm">Carregando...</div>
  if (!area) return <div className="text-red-400 text-sm">Área não encontrada.</div>

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

      {/* Info cards */}
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

      {/* Mapa */}
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
        <div ref={mapContainer} className="w-full h-[400px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
      </div>

      {/* Coordenadas */}
      {coords.length > 0 && (
        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4caf50]" /> Coordenadas do Polígono
            </h3>
            <button onClick={copyCoords}
              className="flex items-center gap-1.5 text-xs text-[#6b8f6b] hover:text-white transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {centroid && (
            <div className="mb-3 p-3 bg-[#1e2e1e] rounded-lg">
              <div className="text-[#6b8f6b] text-xs mb-1">Ponto central (centróide)</div>
              <div className="text-white text-sm font-mono">
                Lat: {centroid[1].toFixed(6)} | Lng: {centroid[0].toFixed(6)}
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {coords.slice(0, -1).map((coord: number[], i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-3 bg-[#1e2e1e] rounded-lg">
                <span className="text-[#4d7a4d] text-xs w-6 shrink-0">#{i + 1}</span>
                <span className="text-white text-xs font-mono">
                  Lat: {coord[1].toFixed(6)} | Lng: {coord[0].toFixed(6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

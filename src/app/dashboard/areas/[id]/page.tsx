'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ruler, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRef } from 'react'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function AreaDetailPage() {
  const { id } = useParams()
  const [area, setArea] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

      // Zoom automático para o polígono
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

  if (loading) return <div className="text-[#4d7a4d] text-sm">Carregando...</div>
  if (!area) return <div className="text-red-400 text-sm">Área não encontrada.</div>

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

      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            {area.size_hectares && (
              <div className="flex items-center gap-1.5 text-[#4caf50] text-sm">
                <Ruler className="w-4 h-4" />
                <span>{Number(area.size_hectares).toFixed(2)} hectares</span>
              </div>
            )}
            {area.land_use && <span className="text-xs text-[#6b8f6b]">{area.land_use}</span>}
          </div>
        </div>

        <div ref={mapContainer} className="w-full h-[420px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
      </div>
    </div>
  )
}

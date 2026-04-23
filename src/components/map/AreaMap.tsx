'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Ruler, Trash2, Info } from 'lucide-react'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

function calcArea(geojson: any): number {
  const coords = geojson.geometry.coordinates[0]
  if (!coords || coords.length < 3) return 0
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    area += coords[i][0] * coords[i + 1][1]
    area -= coords[i + 1][0] * coords[i][1]
  }
  area = Math.abs(area) / 2
  return (area * 111320 * 111320 * Math.cos((coords[0][1] * Math.PI) / 180)) / 10000
}

export default function AreaMap({ initialGeojson, onPolygonChange, readonly = false }: any) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const drawRef = useRef<any>(null)
  const [hectares, setHectares] = useState(0)
  const [hasPolygon, setHasPolygon] = useState(false)

  const handleDrawUpdate = useCallback(() => {
    if (!drawRef.current) return
    const feature = drawRef.current.getAll().features[0]
    if (feature) {
      const ha = calcArea(feature)
      setHectares(ha)
      setHasPolygon(true)
      onPolygonChange(feature, ha)
    } else {
      setHectares(0)
      setHasPolygon(false)
      onPolygonChange(null, 0)
    }
  }, [onPolygonChange])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css'
    document.head.appendChild(link)

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-47.9292, -15.7801],
      zoom: 5,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }))

    if (!readonly) {
      import('@mapbox/mapbox-gl-draw').then((module) => {
        const MapboxDraw = module.default || module
        const draw = new (MapboxDraw as any)({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
        })
        map.addControl(draw)
        drawRef.current = draw
        map.on('draw.create', handleDrawUpdate)
        map.on('draw.update', handleDrawUpdate)
        map.on('draw.delete', handleDrawUpdate)
        if (initialGeojson) {
          map.on('load', () => {
            draw.add(initialGeojson)
            setHectares(calcArea(initialGeojson))
            setHasPolygon(true)
          })
        }
      })
    } else if (initialGeojson) {
      map.on('load', () => {
        map.addSource('area', { type: 'geojson', data: initialGeojson })
        map.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.25 } })
        map.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#4caf50', 'line-width': 2 } })
      })
    }

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; drawRef.current = null }
  }, [])

  return (
    <div className="space-y-2">
      {!readonly && (
        <div className="flex items-center justify-between bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-[#4caf50]" />
            <span className="text-[#6b8f6b]">{hasPolygon ? 'Polígono desenhado.' : 'Clique no ícone de polígono para desenhar.'}</span>
          </div>
          {hasPolygon && (
            <button onClick={() => { drawRef.current?.deleteAll(); handleDrawUpdate() }} className="flex items-center gap-1.5 text-xs text-red-400">
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-[420px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
      {hasPolygon && (
        <div className="flex items-center gap-2 bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-lg px-3 py-2">
          <Ruler className="w-4 h-4 text-[#4caf50]" />
          <span className="text-[#4caf50] text-sm">Área: <strong>{hectares.toFixed(2)} ha</strong></span>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Ruler, Trash2, Info } from 'lucide-react'

interface AreaMapProps {
  initialGeojson?: any
  onPolygonChange: (geojson: any, hectares: number) => void
  readonly?: boolean
}

function calculateAreaHectares(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    area += coords[i][0] * coords[i + 1][1]
    area -= coords[i + 1][0] * coords[i][1]
  }
  area = Math.abs(area) / 2
  const metersSquared = area * 111320 * 111320 * Math.cos((coords[0][1] * Math.PI) / 180)
  return metersSquared / 10000
}

export default function AreaMap({ initialGeojson, onPolygonChange, readonly = false }: AreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const drawingManagerRef = useRef<any>(null)
  const polygonRef = useRef<any>(null)
  const [hectares, setHectares] = useState(0)
  const [hasPolygon, setHasPolygon] = useState(false)

  const buildGeoJSON = useCallback((coords: [number, number][]) => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
    properties: {}
  }), [])

  const handlePolygonUpdate = useCallback((polygon: any) => {
    const coords: [number, number][] = polygon.getPath().getArray().map((p: any) => [p.lng(), p.lat()])
    const ha = calculateAreaHectares(coords)
    setHectares(ha)
    setHasPolygon(true)
    onPolygonChange(buildGeoJSON(coords), ha)
  }, [buildGeoJSON, onPolygonChange])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey || !mapRef.current) return

    function initMap() {
      if (!mapRef.current) return
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: -15.7801, lng: -47.9292 },
        zoom: 5,
        mapTypeId: 'satellite',
        streetViewControl: false,
        fullscreenControl: true,
      })
      googleMapRef.current = map

      if (!readonly) {
        const dm = new (window as any).google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: (window as any).google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon'],
          },
          polygonOptions: {
            fillColor: '#4caf50', fillOpacity: 0.3,
            strokeColor: '#4caf50', strokeWeight: 2,
            editable: true,
          },
        })
        dm.setMap(map)
        drawingManagerRef.current = dm

        (window as any).google.maps.event.addListener(dm, 'polygoncomplete', (polygon: any) => {
          if (polygonRef.current) polygonRef.current.setMap(null)
          polygonRef.current = polygon
          dm.setDrawingMode(null)
          handlePolygonUpdate(polygon)
          polygon.getPath().addListener('set_at', () => handlePolygonUpdate(polygon))
          polygon.getPath().addListener('insert_at', () => handlePolygonUpdate(polygon))
        })

        if (initialGeojson?.geometry?.coordinates?.[0]) {
          loadPolygon(map, initialGeojson, true)
        }
      } else if (initialGeojson?.geometry?.coordinates?.[0]) {
        loadPolygon(map, initialGeojson, false)
      }
    }

    function loadPolygon(map: any, geojson: any, editable: boolean) {
      const coords = geojson.geometry.coordinates[0].map((c: number[]) => ({ lat: c[1], lng: c[0] }))
      const polygon = new (window as any).google.maps.Polygon({
        paths: coords, fillColor: '#4caf50', fillOpacity: 0.3,
        strokeColor: '#4caf50', strokeWeight: 2, editable, map,
      })
      polygonRef.current = polygon
      const ha = calculateAreaHectares(geojson.geometry.coordinates[0].map((c: number[]) => [c[0], c[1]]))
      setHectares(ha)
      setHasPolygon(true)
      const bounds = new (window as any).google.maps.LatLngBounds()
      coords.forEach((c: any) => bounds.extend(c))
      map.fitBounds(bounds, 60)
      if (editable) {
        polygon.getPath().addListener('set_at', () => handlePolygonUpdate(polygon))
        polygon.getPath().addListener('insert_at', () => handlePolygonUpdate(polygon))
      }
    }

    if ((window as any).google?.maps) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      if (polygonRef.current) polygonRef.current.setMap(null)
    }
  }, [])

  function handleClear() {
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null }
    setHasPolygon(false)
    setHectares(0)
    onPolygonChange(null, 0)
  }

  return (
    <div className="space-y-2">
      {!readonly && (
        <div className="flex items-center justify-between bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-[#4caf50]" />
            <span className="text-[#6b8f6b]">
              {hasPolygon ? 'Polígono desenhado. Clique nos vértices para editar.' : 'Clique no ícone de polígono no mapa para desenhar a área.'}
            </span>
          </div>
          {hasPolygon && (
            <button onClick={handleClear} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      )}
      <div ref={mapRef} className="w-full h-[420px] rounded-xl overflow-hidden border border-[#2d3d2d]" />
      {hasPolygon && (
        <div className="flex items-center gap-2 bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-lg px-3 py-2">
          <Ruler className="w-4 h-4 text-[#4caf50]" />
          <span className="text-[#4caf50] text-sm font-medium">
            Área aproximada: <strong>{hectares.toFixed(2)} hectares</strong>
          </span>
        </div>
      )}
    </div>
  )
}

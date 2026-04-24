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
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const [hectares, setHectares] = useState(0)
  const [hasPolygon, setHasPolygon] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const extractCoords = useCallback((polygon: google.maps.Polygon): [number, number][] => {
    return polygon.getPath().getArray().map(p => [p.lng(), p.lat()])
  }, [])

  const buildGeoJSON = useCallback((coords: [number, number][]) => {
    const closed = [...coords, coords[0]]
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closed] },
      properties: {}
    }
  }, [])

  const handlePolygonUpdate = useCallback((polygon: google.maps.Polygon) => {
    const coords = extractCoords(polygon)
    const ha = calculateAreaHectares(coords)
    setHectares(ha)
    setHasPolygon(true)
    onPolygonChange(buildGeoJSON(coords), ha)
  }, [extractCoords, buildGeoJSON, onPolygonChange])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey || !mapRef.current) return

    // Verificar se já carregou
    if (window.google?.maps) {
      initMap()
      return
    }

    // Carregar script do Google Maps
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry`
    script.async = true
    script.defer = true
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => {
      if (polygonRef.current) polygonRef.current.setMap(null)
      if (drawingManagerRef.current) drawingManagerRef.current.setMap(null)
    }
  }, [])

  function initMap() {
    if (!mapRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -15.7801, lng: -47.9292 },
      zoom: 5,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['satellite', 'hybrid', 'roadmap'],
      },
      streetViewControl: false,
      fullscreenControl: true,
    })

    googleMapRef.current = map
    setMapLoaded(true)

    if (!readonly) {
      // Drawing Manager para desenhar polígonos
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: '#4caf50',
          fillOpacity: 0.3,
          strokeColor: '#4caf50',
          strokeWeight: 2,
          editable: true,
          draggable: false,
        },
      })

      drawingManager.setMap(map)
      drawingManagerRef.current = drawingManager

      // Quando termina de desenhar
      google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        // Remove polígono anterior
        if (polygonRef.current) polygonRef.current.setMap(null)
        polygonRef.current = polygon

        // Para de desenhar
        drawingManager.setDrawingMode(null)

        handlePolygonUpdate(polygon)

        // Atualiza ao editar vértices
        google.maps.event.addListener(polygon.getPath(), 'set_at', () => handlePolygonUpdate(polygon))
        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => handlePolygonUpdate(polygon))
      })

      // Carregar polígono existente
      if (initialGeojson?.geometry?.coordinates?.[0]) {
        loadExistingPolygon(map, initialGeojson, true)
      }
    } else {
      // Modo somente leitura
      if (initialGeojson?.geometry?.coordinates?.[0]) {
        loadExistingPolygon(map, initialGeojson, false)
      }
    }
  }

  function loadExistingPolygon(map: google.maps.Map, geojson: any, editable: boolean) {
    const coords = geojson.geometry.coordinates[0].map((c: number[]) => ({
      lat: c[1], lng: c[0]
    }))

    const polygon = new google.maps.Polygon({
      paths: coords,
      fillColor: '#4caf50',
      fillOpacity: 0.3,
      strokeColor: '#4caf50',
      strokeWeight: 2,
      editable,
      map,
    })

    polygonRef.current = polygon

    const ha = calculateAreaHectares(
      geojson.geometry.coordinates[0].map((c: number[]) => [c[0], c[1]])
    )
    setHectares(ha)
    setHasPolygon(true)

    if (editable) {
      google.maps.event.addListener(polygon.getPath(), 'set_at', () => handlePolygonUpdate(polygon))
      google.maps.event.addListener(polygon.getPath(), 'insert_at', () => handlePolygonUpdate(polygon))
    }

    // Zoom para o polígono
    const bounds = new google.maps.LatLngBounds()
    coords.forEach((c: any) => bounds.extend(c))
    map.fitBounds(bounds, 60)
  }

  function handleClear() {
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
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
              {hasPolygon
                ? 'Polígono desenhado. Clique nos vértices para editar.'
                : 'Clique no ícone de polígono no mapa
cat > src/app/dashboard/areas/\[id\]/page.tsx << 'ENDOFFILE'
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

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: coords[0].lat, lng: coords[0].lng },
        zoom: 15,
        mapTypeId: 'satellite',
        streetViewControl: false,
      })

      const polygon = new google.maps.Polygon({
        paths: coords,
        fillColor: '#4caf50',
        fillOpacity: 0.3,
        strokeColor: '#4caf50',
        strokeWeight: 2,
        map,
      })

      const bounds = new google.maps.LatLngBounds()
      coords.forEach((c: any) => bounds.extend(c))
      map.fitBounds(bounds, 60)
    }

    if (window.google?.maps) {
      initMap()
    } else {
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
            <button onClick={copyCoords}
              className="flex items-center gap-1.5 text-xs text-[#6b8f6b] hover:text-white">
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

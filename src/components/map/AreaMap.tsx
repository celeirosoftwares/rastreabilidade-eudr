// src/components/map/AreaMap.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Ruler, Trash2, Info } from 'lucide-react'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Calcula área aproximada em hectares a partir de um GeoJSON polygon
function calculateAreaHectares(geojson: GeoJSON.Feature<GeoJSON.Polygon>): number {
  const coords = geojson.geometry.coordinates[0]
  if (!coords || coords.length < 3) return 0

  // Fórmula de Shoelace (aproximada em graus → convertida para hectares)
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    area += coords[i][0] * coords[i + 1][1]
    area -= coords[i + 1][0] * coords[i][1]
  }
  area = Math.abs(area) / 2

  // Conversão graus² → m² (aproximação para latitudes brasileiras)
  const metersSquared = area * 111320 * 111320 * Math.cos((coords[0][1] * Math.PI) / 180)
  return metersSquared / 10000 // m² → hectares
}

interface AreaMapProps {
  initialGeojson?: GeoJSON.Feature<GeoJSON.Polygon> | null
  onPolygonChange: (geojson: GeoJSON.Feature<GeoJSON.Polygon> | null, hectares: number) => void
  readonly?: boolean
}

export default function AreaMap({ initialGeojson, onPolygonChange, readonly = false }: AreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [hectares, setHectares] = useState<number>(0)
  const [hasPolygon, setHasPolygon] = useState(false)

  const handleDrawUpdate = useCallback(() => {
    if (!drawRef.current) return
    const data = drawRef.current.getAll()
    const feature = data.features[0] as GeoJSON.Feature<GeoJSON.Polygon> | undefined

    if (feature) {
      const ha = calculateAreaHectares(feature)
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

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-47.9292, -15.7801], // Centro do Brasil
      zoom: 5,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }))

    if (!readonly) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#4caf50',
              'fill-opacity': 0.2,
            },
          },
          {
            id: 'gl-draw-polygon-stroke',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon']],
            paint: {
              'line-color': '#4caf50',
              'line-width': 2,
            },
          },
          {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 4,
              'circle-color': '#4caf50',
            },
          },
          {
            id: 'gl-draw-polygon-vertex',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            paint: {
              'circle-radius': 6,
              'circle-color': '#fff',
              'circle-stroke-color': '#4caf50',
              'circle-stroke-width': 2,
            },
          },
        ],
      })

      map.addControl(draw)
      drawRef.current = draw

      map.on('draw.create', handleDrawUpdate)
      map.on('draw.update', handleDrawUpdate)
      map.on('draw.delete', handleDrawUpdate)

      // Carregar polígono existente (modo edição)
      if (initialGeojson) {
        map.on('load', () => {
          draw.add(initialGeojson)
          const ha = calculateAreaHectares(initialGeojson)
          setHectares(ha)
          setHasPolygon(true)

          // Zoom para o polígono
          const coords = initialGeojson.geometry.coordinates[0]
          const bounds = coords.reduce(
            (b, c) => b.extend(c as [number, number]),
            new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
          )
          map.fitBounds(bounds, { padding: 60 })
        })
      }
    } else if (initialGeojson) {
      // Modo somente leitura: exibir polígono como layer
      map.on('load', () => {
        map.addSource('area-polygon', {
          type: 'geojson',
          data: initialGeojson,
        })

        map.addLayer({
          id: 'area-polygon-fill',
          type: 'fill',
          source: 'area-polygon',
          paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.25 },
        })

        map.addLayer({
          id: 'area-polygon-line',
          type: 'line',
          source: 'area-polygon',
          paint: { 'line-color': '#4caf50', 'line-width': 2 },
        })

        const coords = initialGeojson.geometry.coordinates[0]
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
        )
        map.fitBounds(bounds, { padding: 60 })
      })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
  }, [])

  function handleClear() {
    if (drawRef.current) {
      drawRef.current.deleteAll()
      handleDrawUpdate()
    }
  }

  return (
    <div className="space-y-2">
      {/* Barra de informações do polígono */}
      {!readonly && (
        <div className="flex items-center justify-between bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-[#4caf50]" />
            <span className="text-[#6b8f6b]">
              {hasPolygon
                ? 'Polígono desenhado. Clique nos vértices para editar.'
                : 'Clique no ícone de polígono para começar a desenhar a área.'}
            </span>
          </div>
          {hasPolygon && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Mapa */}
      <div
        ref={mapContainer}
        className="w-full h-[420px] rounded-xl overflow-hidden border border-[#2d3d2d]"
      />

      {/* Área calculada */}
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

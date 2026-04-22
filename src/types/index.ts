// ============================================================
// Types globais da plataforma EUDR
// ============================================================

export type UserRole = 'owner' | 'admin' | 'member'
export type LotStatus = 'active' | 'harvested' | 'sold' | 'archived'
export type CropType = 'coffee' | 'soy' | 'sugarcane' | 'corn' | 'cotton' | 'other'
export type EventType = 'planting' | 'harvest' | 'transport' | 'processing' | 'sale' | 'certification' | 'inspection'
export type LandUse = 'cultivation' | 'native' | 'arl' | 'app' | 'other'

// -------- Entidades principais --------

export interface Organization {
  id: string
  name: string
  document_id: string | null
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Property {
  id: string
  organization_id: string
  name: string
  owner_name: string
  document_id: string
  car_number: string | null
  state: string | null
  municipality: string | null
  created_at: string
  updated_at: string
  // Relations
  areas?: Area[]
  lots?: Lot[]
}

export interface Area {
  id: string
  property_id: string
  name: string
  geojson: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  size_hectares: number | null
  land_use: LandUse | null
  created_at: string
  updated_at: string
  // Relations
  property?: Property
}

export interface Lot {
  id: string
  property_id: string
  area_id: string | null
  crop_type: CropType
  harvest_year: number | null
  status: LotStatus
  metadata: LotMetadata
  created_at: string
  updated_at: string
  // Relations
  property?: Property
  area?: Area
  events?: LotEvent[]
}

export interface LotEvent {
  id: string
  lot_id: string
  type: EventType
  description: string | null
  date: string
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export interface Document {
  id: string
  entity_type: 'property' | 'lot' | 'event'
  entity_id: string
  name: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

// -------- Metadata por cultura (JSONB flexível) --------

export interface CoffeeMetadata {
  processing_type?: 'natural' | 'washed' | 'honey' | 'pulped_natural'
  quality_score?: number         // 0–100 (SCA)
  variety?: string               // Arabica, Robusta, Bourbon, etc.
  altitude_meters?: number
  certification?: string[]       // 'rainforest' | 'fair_trade' | 'organic'
  bags_quantity?: number
  bag_weight_kg?: number
}

export interface SoyMetadata {
  volume_tons?: number
  storage_location?: string
  gmo?: boolean
  certification?: string[]
}

export interface SugarcaneMetadata {
  volume_tons?: number
  destination?: 'sugar' | 'ethanol' | 'both'
  brix_degree?: number
}

export type LotMetadata = CoffeeMetadata | SoyMetadata | SugarcaneMetadata | Record<string, unknown>

// -------- Dashboard Stats --------

export interface DashboardStats {
  total_properties: number
  total_areas: number
  total_lots: number
  lots_by_crop: Record<CropType, number>
  lots_by_status: Record<LotStatus, number>
  recent_events: LotEvent[]
}

// -------- Formulários --------

export interface PropertyFormData {
  name: string
  owner_name: string
  document_id: string
  car_number?: string
  state?: string
  municipality?: string
}

export interface AreaFormData {
  name: string
  property_id: string
  geojson: GeoJSON.Feature<GeoJSON.Polygon>
  size_hectares?: number
  land_use?: LandUse
}

export interface LotFormData {
  property_id: string
  area_id?: string
  crop_type: CropType
  harvest_year?: number
  metadata: LotMetadata
}

export interface EventFormData {
  lot_id: string
  type: EventType
  description?: string
  date: string
  metadata?: Record<string, unknown>
}

// -------- Hooks futuros (preparados) --------

export interface RiskScore {
  score: number            // 0–100
  level: 'low' | 'medium' | 'high'
  factors: string[]
  calculated_at: string
}

export interface DeforestationCheckResult {
  area_id: string
  has_risk: boolean
  risk_level: 'none' | 'low' | 'medium' | 'high'
  source: string
  checked_at: string
}

export interface N8nWebhookPayload {
  event: string
  entity_type: string
  entity_id: string
  data: Record<string, unknown>
  timestamp: string
}

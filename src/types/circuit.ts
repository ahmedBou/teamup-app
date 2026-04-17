export type CircuitDifficulty = 'easy' | 'medium' | 'hard'

export type GeoJsonLineString = {
  type: 'LineString'
  coordinates: [number, number][]
}

export type Circuit = {
  id: string
  name: string
  city: string
  difficulty: CircuitDifficulty
  distance_km: number
  duration_min: number
  cover_image_url: string | null
  geojson: GeoJsonLineString | null
  elevation_gain_m: number | null
  start_lat: number | null
  start_lng: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CreateCircuitInput = {
  name: string
  city: string
  difficulty: CircuitDifficulty
  distance_km: number
  duration_min: number
  cover_image_url?: string | null
  geojson?: GeoJsonLineString | null
  elevation_gain_m?: number | null
  start_lat?: number | null
  start_lng?: number | null
  is_active?: boolean
}

export type UpdateCircuitInput = Partial<CreateCircuitInput>
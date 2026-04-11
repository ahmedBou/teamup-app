export type CircuitDifficulty = 'easy' | 'medium' | 'hard'

export type Circuit = {
  id: string
  name: string
  city: string
  difficulty: CircuitDifficulty
  distance_km: number
  duration_min: number
  geojson: Record<string, any>
  cover_image_url: string | null
  is_active: boolean
  created_at: string
}
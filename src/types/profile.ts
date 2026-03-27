export type CyclingLevel = 'beginner' | 'intermediate' | 'advanced'
export type RidingStyle = 'road' | 'mtb' | 'gravel' | 'casual'

export type Profile = {
  id: string
  email: string | null
  first_name: string | null
  avatar_url: string | null
  city: string | null
  bio: string | null
  cycling_level: CyclingLevel | null
  riding_style: RidingStyle | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type UpsertProfileInput = {
  id: string
  email?: string | null
  first_name?: string | null
  avatar_url?: string | null
  city?: string | null
  bio?: string | null
  cycling_level?: CyclingLevel | null
  riding_style?: RidingStyle | null
  onboarding_completed?: boolean
}

export type UpdateProfileInput = {
  first_name?: string | null
  avatar_url?: string | null
  city?: string | null
  bio?: string | null
  cycling_level?: CyclingLevel | null
  riding_style?: RidingStyle | null
  onboarding_completed?: boolean
}
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'

export type UpdateProfileInput = {
  first_name?: string | null
  city?: string | null
  bio?: string | null
  cycling_level?: 'beginner' | 'intermediate' | 'advanced' | null
  riding_style?: 'road' | 'mtb' | 'gravel' | 'casual' | null
  onboarding_completed?: boolean
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as Profile | null
  },

  async ensureProfile(userId: string, email?: string | null): Promise<Profile> {
    const existing = await this.getProfile(userId)

    if (existing) {
      return existing
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email ?? null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as Profile
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: input.first_name ?? null,
        city: input.city ?? null,
        bio: input.bio ?? null,
        cycling_level: input.cycling_level ?? null,
        riding_style: input.riding_style ?? null,
        onboarding_completed: input.onboarding_completed,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as Profile
  },
}
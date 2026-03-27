import { supabase } from '../lib/supabase'
import type { Profile, UpdateProfileInput, UpsertProfileInput } from '../types/profile'

export const profileService = {
  async getMyProfile(userId: string): Promise<Profile | null> {
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

  async createProfileIfMissing(input: UpsertProfileInput): Promise<Profile> {
    const existing = await this.getMyProfile(input.id)

    if (existing) {
      return existing
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: input.id,
        email: input.email ?? null,
        first_name: input.first_name ?? null,
        avatar_url: input.avatar_url ?? null,
        city: input.city ?? null,
        bio: input.bio ?? null,
        cycling_level: input.cycling_level ?? null,
        riding_style: input.riding_style ?? null,
        onboarding_completed: input.onboarding_completed ?? false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as Profile
  },

  async updateMyProfile(userId: string, updates: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as Profile
  },

  async ensureProfileFromSessionUser(): Promise<Profile> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      throw new Error('No authenticated user found')
    }

    const metadata = user.user_metadata ?? {}

    const firstName =
      metadata.given_name ??
      metadata.first_name ??
      metadata.name?.split?.(' ')?.[0] ??
      null

    const avatarUrl =
      metadata.avatar_url ??
      metadata.picture ??
      null

    return await this.createProfileIfMissing({
      id: user.id,
      email: user.email ?? null,
      first_name: firstName,
      avatar_url: avatarUrl,
      onboarding_completed: false,
    })
  },

  async completeOnboarding(
    userId: string,
    updates: Omit<UpdateProfileInput, 'onboarding_completed'>
  ): Promise<Profile> {
    return await this.updateMyProfile(userId, {
      ...updates,
      onboarding_completed: true,
    })
  },
}
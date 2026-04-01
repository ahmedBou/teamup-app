import { useCallback, useEffect, useState } from 'react'
import { profileService, type UpdateProfileInput } from '../src/services/profileService'
import type { Profile } from '../src/types/profile'

type UseProfileResult = {
  profile: Profile | null
  loading: boolean
  error: string | null
  ensureProfile: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (input: UpdateProfileInput) => Promise<void>
}

export function useProfile(userId?: string | null, email?: string | null): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await profileService.getProfile(userId)
      setProfile(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const ensureProfile = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const data = await profileService.ensureProfile(userId, email)
      setProfile(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to ensure profile')
    } finally {
      setLoading(false)
    }
  }, [userId, email])

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!userId) {
        throw new Error('Missing userId')
      }

      try {
        setLoading(true)
        setError(null)

        const data = await profileService.updateProfile(userId, input)
        setProfile(data)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to update profile')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return {
    profile,
    loading,
    error,
    ensureProfile,
    refreshProfile,
    updateProfile,
  }
}
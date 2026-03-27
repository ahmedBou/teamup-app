import { useCallback, useEffect, useState } from 'react'
import { profileService } from '../src/services/profileService'
import type { Profile, UpdateProfileInput } from '../src/types/profile'

type UseProfileResult = {
  profile: Profile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  ensureProfile: () => Promise<void>
  updateProfile: (updates: UpdateProfileInput) => Promise<void>
}

export function useProfile(userId?: string | null): UseProfileResult {
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

      const data = await profileService.getMyProfile(userId)
      setProfile(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const ensureProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await profileService.ensureProfileFromSessionUser()
      setProfile(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to ensure profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateProfile = useCallback(
    async (updates: UpdateProfileInput) => {
      if (!userId) {
        throw new Error('No userId provided')
      }

      try {
        setLoading(true)
        setError(null)

        const updated = await profileService.updateMyProfile(userId, updates)
        setProfile(updated)
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
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    refreshProfile()
  }, [userId, refreshProfile])

  return {
    profile,
    loading,
    error,
    refreshProfile,
    ensureProfile,
    updateProfile,
  }
}
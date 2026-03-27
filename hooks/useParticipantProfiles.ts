import { useCallback, useEffect, useState } from 'react'
import {
    activityParticipantProfileService,
    type ActivityParticipantProfile,
} from '../src/services/activityParticipantProfileService'

type UseParticipantProfilesResult = {
  participantProfiles: ActivityParticipantProfile[]
  loading: boolean
  error: string | null
  refreshParticipantProfiles: () => Promise<void>
}

export function useParticipantProfiles(
  activityId?: string | null
): UseParticipantProfilesResult {
  const [participantProfiles, setParticipantProfiles] = useState<ActivityParticipantProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshParticipantProfiles = useCallback(async () => {
    if (!activityId) {
      setParticipantProfiles([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await activityParticipantProfileService.listParticipantProfiles(activityId)
      setParticipantProfiles(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load participant profiles')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    refreshParticipantProfiles()
  }, [refreshParticipantProfiles])

  return {
    participantProfiles,
    loading,
    error,
    refreshParticipantProfiles,
  }
}
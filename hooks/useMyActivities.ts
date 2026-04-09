import { useCallback, useEffect, useState } from 'react'
import { activityService } from '../src/services/activityService'
import type { Activity } from '../src/types/activity'

type UseMyActivitiesResult = {
  hostedActivities: Activity[]
  joinedActivities: Activity[]
  loading: boolean
  error: string | null
  refreshMyActivities: () => Promise<void>
}

export function useMyActivities(userId?: string | null): UseMyActivitiesResult {
  const [hostedActivities, setHostedActivities] = useState<Activity[]>([])
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshMyActivities = useCallback(async () => {
    if (!userId) {
      setHostedActivities([])
      setJoinedActivities([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [hosted, joined] = await Promise.all([
        activityService.listHostedActivities(userId),
        activityService.listJoinedActivities(userId),
      ])

      setHostedActivities(hosted)
      setJoinedActivities(joined.filter((activity) => activity.host_id !== userId))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load your activities')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refreshMyActivities()
  }, [refreshMyActivities])

  return {
    hostedActivities,
    joinedActivities,
    loading,
    error,
    refreshMyActivities,
  }
}
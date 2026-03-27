import { useCallback, useEffect, useState } from 'react'
import { activityService } from '../src/services/activityService'
import type { Activity } from '../src/types/activity'

type UseActivitiesResult = {
  activities: Activity[]
  loading: boolean
  error: string | null
  refreshActivities: () => Promise<void>
}

export function useActivities(): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await activityService.listUpcomingActivities()
      setActivities(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshActivities()
  }, [refreshActivities])

  return {
    activities,
    loading,
    error,
    refreshActivities,
  }
}
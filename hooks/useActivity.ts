import { useCallback, useEffect, useState } from 'react'
import { activityService } from '../src/services/activityService'
import type { Activity } from '../src/types/activity'

type UseActivityResult = {
  activity: Activity | null
  loading: boolean
  error: string | null
  refreshActivity: () => Promise<void>
}

export function useActivity(activityId?: string | null): UseActivityResult {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshActivity = useCallback(async () => {
    if (!activityId) {
      setActivity(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await activityService.getActivityById(activityId)
      setActivity(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  return {
    activity,
    loading,
    error,
    refreshActivity,
  }
}
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../src/lib/supabase'

export type ActivityParticipantPreview = {
  activityId: string
  userId: string
  firstName: string | null
  avatarUrl: string | null
  city: string | null
}

type UseActivityParticipantPreviewsResult = {
  previewsByActivityId: Record<string, ActivityParticipantPreview[]>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useActivityParticipantPreviews(
  activityIds: string[]
): UseActivityParticipantPreviewsResult {
  const [previewsByActivityId, setPreviewsByActivityId] = useState<
    Record<string, ActivityParticipantPreview[]>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stableIds = useMemo(() => {
    return [...activityIds].filter(Boolean).sort()
  }, [JSON.stringify(activityIds)])

  const refresh = useCallback(async () => {
    if (stableIds.length === 0) {
      setPreviewsByActivityId({})
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('activity_participants')
        .select(`
          activity_id,
          user_id,
          profiles:user_id (
            first_name,
            avatar_url,
            city
          )
        `)
        .in('activity_id', stableIds)

      if (error) throw error

      const grouped: Record<string, ActivityParticipantPreview[]> = {}

      for (const activityId of stableIds) {
        grouped[activityId] = []
      }

      for (const row of data ?? []) {
        const profile = Array.isArray((row as any).profiles)
          ? (row as any).profiles[0]
          : (row as any).profiles

        const preview: ActivityParticipantPreview = {
          activityId: (row as any).activity_id,
          userId: (row as any).user_id,
          firstName: profile?.first_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          city: profile?.city ?? null,
        }

        if (!grouped[preview.activityId]) {
          grouped[preview.activityId] = []
        }

        grouped[preview.activityId].push(preview)
      }

      setPreviewsByActivityId(grouped)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load participant previews')
    } finally {
      setLoading(false)
    }
  }, [stableIds])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    previewsByActivityId,
    loading,
    error,
    refresh,
  }
}
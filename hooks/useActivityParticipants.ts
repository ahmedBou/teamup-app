import { useCallback, useEffect, useState } from 'react'
import { participantService, type ActivityParticipant } from '../src/services/participantService'

type UseActivityParticipantsResult = {
  participants: ActivityParticipant[]
  loading: boolean
  error: string | null
  participantCount: number
  isJoined: boolean
  refreshParticipants: () => Promise<void>
  join: () => Promise<void>
}

export function useActivityParticipants(
  activityId?: string | null,
  userId?: string | null
): UseActivityParticipantsResult {
  const [participants, setParticipants] = useState<ActivityParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshParticipants = useCallback(async () => {
    if (!activityId) {
      setParticipants([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await participantService.listParticipants(activityId)
      setParticipants(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load participants')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  const join = useCallback(async () => {
    if (!activityId || !userId) {
      throw new Error('Missing activityId or userId')
    }

    try {
      setLoading(true)
      setError(null)

      await participantService.joinActivity(activityId, userId)
      const data = await participantService.listParticipants(activityId)
      setParticipants(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to join activity')
      throw err
    } finally {
      setLoading(false)
    }
  }, [activityId, userId])

  useEffect(() => {
    refreshParticipants()
  }, [refreshParticipants])

  const participantCount = participants.length
  const isJoined = !!userId && participants.some((p) => p.user_id === userId)

  return {
    participants,
    loading,
    error,
    participantCount,
    isJoined,
    refreshParticipants,
    join,
  }
}
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../src/lib/supabase'
import { messageService, type GroupMessage } from '../src/services/messageService'

type UseMessagesResult = {
  messages: GroupMessage[]
  loading: boolean
  error: string | null
  refreshMessages: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
}

export function useMessages(
  activityId?: string | null,
  userId?: string | null
): UseMessagesResult {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const refreshMessages = useCallback(async () => {
    if (!activityId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }

      setError(null)

      const data = await messageService.listMessages(activityId)
      setMessages(data)
      hasLoadedOnce.current = true
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  const sendMessageAction = useCallback(
    async (content: string) => {
      if (!activityId || !userId) {
        throw new Error('Missing activityId or userId')
      }

      try {
        setError(null)
        await messageService.sendMessage(activityId, userId, content)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to send message')
        throw err
      }
    },
    [activityId, userId]
  )

  useEffect(() => {
    hasLoadedOnce.current = false
    refreshMessages()
  }, [refreshMessages])

  useEffect(() => {
    if (!activityId) return

    const channel = supabase
      .channel(`messages:${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `activity_id=eq.${activityId}`,
        },
        async () => {
          try {
            const data = await messageService.listMessages(activityId)
            setMessages(data)
          } catch (err: any) {
            setError(err?.message ?? 'Failed to sync realtime messages')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activityId])

  return {
    messages,
    loading,
    error,
    refreshMessages,
    sendMessage: sendMessageAction,
  }
}
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../src/lib/supabase'
import {
  AppNotification,
  notificationService,
} from '../src/services/notificationService'

type UseNotificationsResult = {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const setupUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return
      setUserId(user?.id ?? null)
    }

    void setupUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setNotifications([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError(null)

        const data = await notificationService.listMyNotifications(userId)
        setNotifications(data)
      } catch (err: any) {
        console.error('useNotifications.fetchNotifications', err)
        setError(err?.message ?? 'Failed to load notifications')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [userId]
  )

  const refresh = useCallback(() => {
    return fetchNotifications(true)
  }, [fetchNotifications])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!userId) return

    const unsubscribe = notificationService.subscribeToMyNotifications(
      userId,
      () => {
        void fetchNotifications(true)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [userId, fetchNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return

      try {
        await notificationService.markAsRead(notificationId, userId)

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId ? { ...item, is_read: true } : item
          )
        )
      } catch (err: any) {
        console.error('useNotifications.markAsRead', err)
        setError(err?.message ?? 'Failed to mark notification as read')
      }
    },
    [userId]
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      await notificationService.markAllAsRead(userId)

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      )
    } catch (err: any) {
      console.error('useNotifications.markAllAsRead', err)
      setError(err?.message ?? 'Failed to mark all notifications as read')
    }
  }, [userId])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  )

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  }
}
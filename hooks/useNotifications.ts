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

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const data = await notificationService.listMyNotifications()
      setNotifications(data)
    } catch (err: any) {
      console.error('useNotifications.fetchNotifications', err)
      setError(err?.message ?? 'Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    return fetchNotifications(true)
  }, [fetchNotifications])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let active = true

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) return

      unsubscribe = notificationService.subscribeToMyNotifications(user.id, () => {
        void fetchNotifications(true)
      })
    }

    void setup()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      )
    } catch (err: any) {
      console.error('useNotifications.markAsRead', err)
      setError(err?.message ?? 'Failed to mark notification as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      )
    } catch (err: any) {
      console.error('useNotifications.markAllAsRead', err)
      setError(err?.message ?? 'Failed to mark all notifications as read')
    }
  }, [])

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
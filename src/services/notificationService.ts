import { supabase } from '../lib/supabase'

export type NotificationType = 'activity_joined' | 'new_message'

type ActorProfile = {
  id: string
  first_name: string | null
  avatar_url: string | null
  city: string | null
}

export type AppNotification = {
  id: string
  user_id: string
  actor_id: string | null
  activity_id: string | null
  message_id: string | null
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  created_at: string
  actor_profile: ActorProfile | null
}

type NotificationRow = {
  id: string
  user_id: string
  actor_id: string | null
  activity_id: string | null
  message_id: string | null
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  created_at: string
  actor_profile: ActorProfile | ActorProfile[] | null
}

function normalizeActorProfile(
  profile: NotificationRow['actor_profile']
): ActorProfile | null {
  if (!profile) return null
  return Array.isArray(profile) ? profile[0] ?? null : profile
}

export const notificationService = {
  async listMyNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        actor_id,
        activity_id,
        message_id,
        type,
        title,
        body,
        is_read,
        created_at,
        actor_profile:profiles!notifications_actor_id_fkey (
          id,
          first_name,
          avatar_url,
          city
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return ((data ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      actor_id: row.actor_id,
      activity_id: row.activity_id,
      message_id: row.message_id,
      type: row.type,
      title: row.title,
      body: row.body,
      is_read: row.is_read,
      created_at: row.created_at,
      actor_profile: normalizeActorProfile(row.actor_profile),
    }))
  },

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw error
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw error
    }
  },

  async markMessageNotificationsAsReadForActivity(
    activityId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .eq('activity_id', activityId)
      .eq('is_read', false)

    if (error) {
      throw error
    }
  },

  subscribeToMyNotifications(userId: string, onChange: () => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
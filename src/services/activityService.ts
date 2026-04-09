import { supabase } from '../lib/supabase'
import type { Activity, CreateActivityInput } from '../types/activity'

function sortActivitiesByStartTime(items: Activity[]): Activity[] {
  return [...items].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

export const activityService = {
  async listUpcomingActivities(): Promise<Activity[]> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .gte('start_time', now)
      .in('status', ['open', 'full'])
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as Activity[]
  },

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        host_id: input.host_id,
        title: input.title,
        description: input.description ?? null,
        activity_type: input.activity_type,
        city: input.city,
        start_time: input.start_time,
        max_participants: input.max_participants,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    const activity = data as Activity

    const { error: participantError } = await supabase
      .from('activity_participants')
      .insert({
        activity_id: activity.id,
        user_id: input.host_id,
      })

    if (participantError) {
      throw participantError
    }

    return activity
  },

  async getActivityById(activityId: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as Activity | null
  },

  async listHostedActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('host_id', userId)
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as Activity[]
  },

  async listJoinedActivities(userId: string): Promise<Activity[]> {
    const { data: participantRows, error: participantError } = await supabase
      .from('activity_participants')
      .select('activity_id')
      .eq('user_id', userId)

    if (participantError) {
      throw participantError
    }

    const activityIds = (participantRows ?? []).map((row: any) => row.activity_id)

    if (activityIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .in('id', activityIds)

    if (error) {
      throw error
    }

    return sortActivitiesByStartTime((data ?? []) as Activity[])
  },

  async updateActivityStatus(
    activityId: string,
    status: 'open' | 'full' | 'cancelled'
  ): Promise<void> {
    const { error } = await supabase
      .from('activities')
      .update({ status })
      .eq('id', activityId)

    if (error) {
      throw error
    }
  },

  async cancelActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('activities')
      .update({ status: 'cancelled' })
      .eq('id', activityId)

    if (error) {
      throw error
    }
  },
}
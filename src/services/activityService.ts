import { supabase } from '../lib/supabase'
import type { Activity, CreateActivityInput } from '../types/activity'

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
  }

}
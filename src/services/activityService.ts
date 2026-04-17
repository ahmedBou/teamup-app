import { supabase } from '../lib/supabase'
import type { Activity } from '../types/activity'

type ActivityRow = Omit<Activity, 'participant_count'> & {
  participant_count?: number
}

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
      .select(`
        *,
        circuit:circuits (
          id,
          name,
          city,
          difficulty,
          distance_km,
          duration_min,
          geojson,
          cover_image_url,
          is_active,
          created_at
        )
      `)
      .gte('start_time', now)
      .in('status', ['open', 'full'])
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    const activities = (data ?? []) as ActivityRow[]

    if (activities.length === 0) {
      return []
    }

    const activityIds = activities.map((activity) => activity.id)

    const { data: participantRows, error: participantError } = await supabase
      .from('activity_participants')
      .select('activity_id')
      .in('activity_id', activityIds)

    if (participantError) {
      throw participantError
    }

    const countMap = new Map<string, number>()

    for (const row of participantRows ?? []) {
      const activityId = row.activity_id as string
      countMap.set(activityId, (countMap.get(activityId) ?? 0) + 1)
    }

    const enrichedActivities: Activity[] = activities.map((activity) => ({
      ...activity,
      participant_count: countMap.get(activity.id) ?? 0,
    }))

    return sortActivitiesByStartTime(enrichedActivities)
  },

async createActivity(input: {
  host_id: string
  title: string
  description: string | null
  activity_type: string
  city: string
  start_time: string
  max_participants: number
  circuit_id: string
}) {
  const { data, error } = await supabase.rpc('create_activity_atomic', {
    p_host_id: input.host_id,
    p_title: input.title,
    p_description: input.description,
    p_activity_type: input.activity_type,
    p_city: input.city,
    p_start_time: input.start_time,
    p_max_participants: input.max_participants,
    p_circuit_id: input.circuit_id,
  })

  if (error) {
    throw error
  }

  return data
},

  async getActivityById(activityId: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        circuit:circuits (
          id,
          name,
          city,
          difficulty,
          distance_km,
          duration_min,
          geojson,
          cover_image_url,
          is_active,
          created_at
        )
      `)
      .eq('id', activityId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) return null

    const { count, error: countError } = await supabase
      .from('activity_participants')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)

    if (countError) {
      throw countError
    }

    return {
      ...(data as Omit<Activity, 'participant_count'>),
      participant_count: count ?? 0,
    }
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

    const activities = ((data ?? []) as Omit<Activity, 'participant_count'>[]).map(
      (activity) => ({
        ...activity,
        participant_count: 0,
      })
    )

    return sortActivitiesByStartTime(activities)
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

    const activities = ((data ?? []) as Omit<Activity, 'participant_count'>[]).map(
      (activity) => ({
        ...activity,
        participant_count: 0,
      })
    )

    return sortActivitiesByStartTime(activities)
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
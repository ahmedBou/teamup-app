import { supabase } from '../lib/supabase'

export type ActivityParticipantProfile = {
  participant_id: string
  activity_id: string
  user_id: string
  joined_at: string
  profile: {
    id: string
    first_name: string | null
    email: string | null
    avatar_url: string | null
    city: string | null
  } | null
}

export const activityParticipantProfileService = {
  async listParticipantProfiles(activityId: string): Promise<ActivityParticipantProfile[]> {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        id,
        activity_id,
        user_id,
        joined_at,
        profiles:user_id (
          id,
          first_name,
          email,
          avatar_url,
          city
        )
      `)
      .eq('activity_id', activityId)
      .order('joined_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []).map((row: any) => ({
      participant_id: row.id,
      activity_id: row.activity_id,
      user_id: row.user_id,
      joined_at: row.joined_at,
      profile: row.profiles
        ? {
            id: row.profiles.id,
            first_name: row.profiles.first_name,
            email: row.profiles.email,
            avatar_url: row.profiles.avatar_url,
            city: row.profiles.city,
          }
        : null,
    }))
  },
}
import { supabase } from '../lib/supabase'

export type ActivityParticipantProfile = {
  participant_id: string
  activity_id: string
  user_id: string
  joined_at: string
  profile: {
    id: string
    first_name: string | null
    avatar_url: string | null
    city: string | null
    bio: string | null
    cycling_level: string | null
    riding_style: string | null
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
        public_profiles:user_id (
          id,
          first_name,
          avatar_url,
          city,
          bio,
          cycling_level,
          riding_style
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
      profile: row.public_profiles
        ? {
            id: row.public_profiles.id,
            first_name: row.public_profiles.first_name,
            avatar_url: row.public_profiles.avatar_url,
            city: row.public_profiles.city,
            bio: row.public_profiles.bio,
            cycling_level: row.public_profiles.cycling_level,
            riding_style: row.public_profiles.riding_style,
          }
        : null,
    }))
  },
}
import { supabase } from '../lib/supabase'

export type ActivityParticipant = {
  id: string
  activity_id: string
  user_id: string
}

export const participantService = {
  async listParticipants(activityId: string): Promise<ActivityParticipant[]> {
    const { data, error } = await supabase
      .from('activity_participants')
      .select('*')
      .eq('activity_id', activityId)

    if (error) throw error

    return (data ?? []) as ActivityParticipant[]
  },

  async isParticipant(activityId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('activity_participants')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return !!data
  },

  async joinActivity(
    activityId: string,
    userId: string
  ): Promise<ActivityParticipant> {
    const { data, error } = await supabase.rpc('join_activity_atomic', {
      p_activity_id: activityId,
      p_user_id: userId,
    })

    if (error) throw error

    return data as ActivityParticipant
  },

  async leaveActivity(activityId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('leave_activity_atomic', {
      p_activity_id: activityId,
      p_user_id: userId,
    })

    if (error) throw error
  },
}
import { supabase } from '../lib/supabase'

export type GroupMessage = {
  id: string
  activity_id: string
  user_id: string
  content: string
  created_at: string
  author: {
    id: string
    first_name: string | null
    avatar_url: string | null
    city: string | null
  } | null
}

function normalizePublicProfile(profile: any) {
  if (!profile) return null
  return Array.isArray(profile) ? profile[0] ?? null : profile
}

export const messageService = {
  async listMessages(activityId: string): Promise<GroupMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        activity_id,
        user_id,
        content,
        created_at,
        public_profiles:user_id (
          id,
          first_name,
          avatar_url,
          city
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []).map((row: any) => {
      const authorProfile = normalizePublicProfile(row.public_profiles)

      return {
        id: row.id,
        activity_id: row.activity_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        author: authorProfile
          ? {
              id: authorProfile.id,
              first_name: authorProfile.first_name,
              avatar_url: authorProfile.avatar_url,
              city: authorProfile.city,
            }
          : null,
      }
    })
  },

  async sendMessage(
    activityId: string,
    userId: string,
    content: string
  ): Promise<GroupMessage> {
    const trimmed = content.trim()

    if (!trimmed) {
      throw new Error('Message content cannot be empty')
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        activity_id: activityId,
        user_id: userId,
        content: trimmed,
      })
      .select(`
        id,
        activity_id,
        user_id,
        content,
        created_at,
        public_profiles:user_id (
          id,
          first_name,
          avatar_url,
          city
        )
      `)
      .single()

    if (error) {
      throw error
    }

    const authorProfile = normalizePublicProfile(data.public_profiles)

    return {
      id: data.id,
      activity_id: data.activity_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      author: authorProfile
        ? {
            id: authorProfile.id,
            first_name: authorProfile.first_name,
            avatar_url: authorProfile.avatar_url,
            city: authorProfile.city,
          }
        : null,
    }
  },
}
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
    email: string | null
  } | null
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
        profiles:user_id (
          id,
          first_name,
          avatar_url,
          email
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      activity_id: row.activity_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      author: row.profiles
        ? {
            id: row.profiles.id,
            first_name: row.profiles.first_name,
            avatar_url: row.profiles.avatar_url,
            email: row.profiles.email,
          }
        : null,
    }))
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
        profiles:user_id (
          id,
          first_name,
          avatar_url,
          email
        )
      `)
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      activity_id: data.activity_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      author: data.profiles
        ? {
            id: data.profiles.id,
            first_name: data.profiles.first_name,
            avatar_url: data.profiles.avatar_url,
            email: data.profiles.email,
          }
        : null,
    }
  },
}
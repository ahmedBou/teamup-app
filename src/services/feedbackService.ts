import { supabase } from '../lib/supabase'

export type FeedbackCategory = 'bug' | 'idea' | 'ux' | 'other'

export type FeedbackInput = {
  user_id: string
  category: FeedbackCategory
  message: string
  screen?: string | null
}

export const feedbackService = {
  async submitFeedback(input: FeedbackInput): Promise<void> {
    const trimmedMessage = input.message.trim()

    if (!trimmedMessage) {
      throw new Error('Feedback message cannot be empty')
    }

    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: input.user_id,
        category: input.category,
        message: trimmedMessage,
        screen: input.screen ?? null,
      })

    if (error) {
      throw error
    }
  },
}
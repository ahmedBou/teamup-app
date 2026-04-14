import { supabase } from '../lib/supabase'
import type { Review, ReviewWithAuthor } from '../types/review'

export const reviewService = {
  async listReviewsForUser(reviewedUserId: string): Promise<ReviewWithAuthor[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer_user_id,
        reviewer:reviewer_user_id (
          first_name
        )
      `)
      .eq('reviewed_user_id', reviewedUserId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment ?? null,
      created_at: row.created_at,
      reviewer_user_id: row.reviewer_user_id,
      author_name: row.reviewer?.first_name ?? null,
    }))
  },

  async upsertReview(input: {
    activity_id: string
    reviewer_user_id: string
    reviewed_user_id: string
    rating: number
    comment?: string | null
  }): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .upsert(
        {
          activity_id: input.activity_id,
          reviewer_user_id: input.reviewer_user_id,
          reviewed_user_id: input.reviewed_user_id,
          rating: input.rating,
          comment: input.comment ?? null,
        },
        {
          onConflict: 'activity_id,reviewer_user_id,reviewed_user_id',
        }
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as Review
  },
}
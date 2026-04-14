export type Review = {
  id: string
  activity_id: string
  reviewer_user_id: string
  reviewed_user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export type ReviewWithAuthor = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_user_id: string
  author_name: string | null
}
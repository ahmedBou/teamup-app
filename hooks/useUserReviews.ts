import { useCallback, useEffect, useState } from 'react'
import { reviewService } from '../src/services/reviewService'
import type { ReviewWithAuthor } from '../src/types/review'

type UseUserReviewsResult = {
  reviews: ReviewWithAuthor[]
  loading: boolean
  error: string | null
  refreshReviews: () => Promise<void>
}

export function useUserReviews(userId?: string | null): UseUserReviewsResult {
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshReviews = useCallback(async () => {
    if (!userId) {
      setReviews([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await reviewService.listReviewsForUser(userId)
      setReviews(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refreshReviews()
  }, [refreshReviews])

  return {
    reviews,
    loading,
    error,
    refreshReviews,
  }
}
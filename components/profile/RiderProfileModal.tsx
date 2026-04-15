import { useState } from 'react'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useUserReviews } from '../../hooks/useUserReviews'
import type { PuzzleSlot } from '../puzzle/PuzzleBoard'
import LeaveReviewModal from './LeaveReviewModal'

type RiderProfileModalProps = {
  rider: PuzzleSlot | null
  visible: boolean
  onClose: () => void
  activityId?: string | null
}

function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function renderStars(rating: number) {
  const safe = Math.max(0, Math.min(5, rating))
  return '★'.repeat(safe) + '☆'.repeat(5 - safe)
}

export default function RiderProfileModal({
  rider,
  visible,
  onClose,
  activityId = null,
}: RiderProfileModalProps) {
  const { session } = useAuth()
  const currentUserId = session?.user?.id ?? null
  const { reviews, refreshReviews } = useUserReviews(rider?.id ?? null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)

  if (!rider) return null

  const canLeaveReview =
    !!currentUserId &&
    !!activityId &&
    currentUserId !== rider.id &&
    !!rider.canReview

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Rider profile</Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.identityRow}>
                {rider.avatarUrl ? (
                  <Image source={{ uri: rider.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarFallbackText}>
                      {getInitials(rider.name)}
                    </Text>
                  </View>
                )}

                <View style={styles.identityText}>
                  <Text style={styles.name}>{rider.name ?? 'Unknown rider'}</Text>
                  <Text style={styles.meta}>{rider.city ?? 'No city'}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Preferences</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Level</Text>
                  <Text style={styles.value}>{rider.cyclingLevel ?? '—'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Style</Text>
                  <Text style={styles.value}>{rider.ridingStyle ?? '—'}</Text>
                </View>

                <Text style={styles.labelBlock}>Bio</Text>
                <Text style={styles.description}>{rider.bio ?? 'No bio yet.'}</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>Reviews</Text>

                  {canLeaveReview ? (
                    <Pressable
                      onPress={() => setReviewModalVisible(true)}
                      style={styles.reviewButton}
                    >
                      <Text style={styles.reviewButtonText}>Leave a review</Text>
                    </Pressable>
                  ) : null}
                </View>

                {reviews.length === 0 ? (
                  <Text style={styles.emptyText}>No reviews yet.</Text>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewAuthor}>
                          {review.author_name ?? 'Anonymous rider'}
                        </Text>
                        <Text style={styles.reviewRating}>
                          {renderStars(review.rating)}
                        </Text>
                      </View>
                      <Text style={styles.reviewComment}>
                        {review.comment ?? '—'}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LeaveReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        activityId={activityId}
        reviewedUserId={rider.id}
        reviewedUserName={rider.name}
        onSubmitted={refreshReviews}
      />
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  identityRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1220',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  labelBlock: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  reviewRating: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
})
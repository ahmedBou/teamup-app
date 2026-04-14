import { useEffect, useState } from 'react'
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { reviewService } from '../../src/services/reviewService'

type LeaveReviewModalProps = {
  visible: boolean
  onClose: () => void
  activityId: string | null
  reviewedUserId: string | null
  reviewedUserName?: string | null
  onSubmitted?: () => Promise<void> | void
}

export default function LeaveReviewModal({
  visible,
  onClose,
  activityId,
  reviewedUserId,
  reviewedUserName,
  onSubmitted,
}: LeaveReviewModalProps) {
  const { session } = useAuth()
  const reviewerUserId = session?.user?.id ?? null

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      setRating(5)
      setComment('')
    }
  }, [visible])

  const handleSubmit = async () => {
    if (!activityId || !reviewedUserId || !reviewerUserId) {
      Alert.alert('Missing data', 'Unable to submit this review.')
      return
    }

    if (reviewerUserId === reviewedUserId) {
      Alert.alert('Not allowed', 'You cannot review yourself.')
      return
    }

    try {
      setSubmitting(true)

      await reviewService.upsertReview({
        activity_id: activityId,
        reviewer_user_id: reviewerUserId,
        reviewed_user_id: reviewedUserId,
        rating,
        comment: comment.trim() || null,
      })

      await onSubmitted?.()
      Alert.alert('Review saved', 'Your review has been submitted.')
      onClose()
    } catch (err: any) {
      Alert.alert('Review failed', err?.message ?? 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            Review {reviewedUserName ?? 'this rider'}
          </Text>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                style={styles.starButton}
              >
                <Text style={[styles.starText, value <= rating && styles.starTextActive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Comment</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="How was the ride with this rider?"
            multiline
            style={styles.input}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[styles.button, styles.submitButton, submitting && styles.disabledButton]}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Saving...' : 'Save review'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  starText: {
    fontSize: 34,
    color: '#cbd5e1',
  },
  starTextActive: {
    color: '#f59e0b',
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#22c55e',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#08101c',
  },
})
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import PuzzlePreview from '../../components/puzzle/PuzzlePreview'
import { useActivities } from '../../hooks/useActivities'
import { useNotifications } from '../../hooks/useNotifications'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function getCardStatus(
  status: string,
  participantCount: number,
  maxParticipants: number
) {
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  if (status === 'full' || participantCount >= maxParticipants) return 'Full'
  return 'Open'
}

export default function HomeScreen() {
  const router = useRouter()
  const { activities, loading, error, refreshActivities } = useActivities()
  const { unreadCount } = useNotifications()

  useFocusEffect(
    useCallback(() => {
      void refreshActivities()
    }, [refreshActivities])
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Find rides</Text>
      <Text style={styles.subtitle}>Join local cycling groups around you.</Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.refreshButton}
          onPress={() => void refreshActivities()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/notifications')}
        >
          <View style={styles.secondaryButtonInner}>
            <Text style={styles.secondaryButtonText}>Messages</Text>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/my-activities')}
        >
          <Text style={styles.secondaryButtonText}>My rides</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {activities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to create a ride in your area.
          </Text>
        </View>
      ) : (
        activities.map((activity) => {
          const participantCount = activity.participant_count ?? 0
          const cardStatus = getCardStatus(
            activity.status,
            participantCount,
            activity.max_participants
          )

          const imageUrl =
            activity.circuit?.cover_image_url ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'

          return (
            <Pressable
              key={activity.id}
              style={styles.card}
              onPress={() => router.push(`/activity/${activity.id}`)}
            >
              <ImageBackground
                source={{ uri: imageUrl }}
                style={styles.cardImage}
                imageStyle={styles.cardImageInner}
              >
                <View style={styles.overlay}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.headerPill}>
                      <Text style={styles.headerPillText}>{activity.activity_type}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        cardStatus === 'Cancelled'
                          ? styles.statusBadgeCancelled
                          : cardStatus === 'Full'
                          ? styles.statusBadgeFull
                          : cardStatus === 'Completed'
                          ? styles.statusBadgeCompleted
                          : styles.statusBadgeOpen,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{cardStatus}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomContent}>
                    <Text style={styles.cardTitle}>{activity.title}</Text>
                    <Text style={styles.cardMeta}>
                      {activity.city} · {formatDate(activity.start_time)}
                    </Text>

                    {activity.circuit ? (
                      <Text style={styles.cardMetaSecondary}>
                        {activity.circuit.name} · {activity.circuit.difficulty} ·{' '}
                        {activity.circuit.distance_km} km
                      </Text>
                    ) : null}

                    <View style={styles.previewCard}>
                      <PuzzlePreview
                        participantCount={participantCount}
                        maxParticipants={activity.max_participants}
                        status={activity.status}
                      />
                    </View>

                    <Text style={styles.openHint}>View ride details</Text>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  cardImage: {
    minHeight: 320,
    justifyContent: 'space-between',
  },
  cardImageInner: {
    borderRadius: 22,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerPill: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeOpen: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeFull: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeCancelled: {
    backgroundColor: '#e5e7eb',
  },
  statusBadgeCompleted: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  cardBottomContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  cardMeta: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
  },
  cardMetaSecondary: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  previewCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  openHint: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
})
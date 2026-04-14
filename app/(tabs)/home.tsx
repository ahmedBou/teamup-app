import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import HomeRidePuzzleOverlay from '../../components/puzzle/HomeRidePuzzleOverlay'
import { useActivities } from '../../hooks/useActivities'
import { useActivityParticipantPreviews } from '../../hooks/useActivityParticipantPreviews'
import { useAuth } from '../../hooks/useAuth'
import { participantService } from '../../src/services/participantService'
import type { Activity } from '../../src/types/activity'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width
const CARD_HEIGHT = Platform.OS === 'web' ? height - 70 : height - 110

function formatRideDate(dateString: string) {
  const date = new Date(dateString)

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${weekday}, ${month} ${day} · ${time}`
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
  const listRef = useRef<FlatList<Activity>>(null)

  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const { activities, loading, error, refreshActivities } = useActivities()
  const activityIds = useMemo(
    () => activities.map((activity) => activity.id),
    [activities]
  )

  const {
    previewsByActivityId,
    refresh: refreshParticipantPreviews,
  } = useActivityParticipantPreviews(activityIds)

  useFocusEffect(
    useCallback(() => {
      void refreshActivities()
    }, [refreshActivities])
  )


  const handleJoinFromHome = async (activity: Activity) => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to join a ride.')
      return
    }

    const participantCount = activity.participant_count ?? 0
    const cardStatus = getCardStatus(
      activity.status,
      participantCount,
      activity.max_participants
    )

    if (cardStatus === 'Cancelled') {
      Alert.alert('Ride cancelled', 'This ride has been cancelled.')
      return
    }

    if (cardStatus === 'Completed') {
      Alert.alert('Ride completed', 'This ride is already completed.')
      return
    }

    if (cardStatus === 'Full') {
      Alert.alert('Ride is full', 'This ride has reached max riders.')
      return
    }

    try {
      await participantService.joinActivity(activity.id, userId)
      await refreshActivities()
      router.push(`/activity/${activity.id}`)
    } catch (err: any) {
      Alert.alert('Join failed', err?.message ?? 'Unknown error')
    }
  }

  const handleSkip = (index: number) => {
    const nextIndex = index + 1
    if (nextIndex >= activities.length) return

    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
      viewPosition: 0,
    })
  }

  const renderRideCard = ({
    item: activity,
    index,
  }: {
    item: Activity
    index: number
  }) => {
    const participantCount = activity.participant_count ?? 0
    const cardStatus = getCardStatus(
      activity.status,
      participantCount,
      activity.max_participants
    )

    const imageUrl =
      activity.circuit?.cover_image_url ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'

    const circuitSummary = activity.circuit
      ? `${activity.circuit.name} · ${activity.circuit.difficulty} · ${activity.circuit.distance_km} km`
      : activity.city

    return (
      <View style={styles.card}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.topHeader}>
              <Pressable
                style={styles.headerLeft}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardCircuit}>{circuitSummary}</Text>
                <Text style={styles.cardTime}>
                  {formatRideDate(activity.start_time)}
                </Text>
              </Pressable>

              <View style={styles.headerRight}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{activity.activity_type}</Text>
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

                <Text style={styles.spotsText}>
                  {participantCount} / {activity.max_participants} spots filled
                </Text>
              </View>
            </View>

           <HomeRidePuzzleOverlay
              participants={(previewsByActivityId[activity.id] ?? []).map((item) => ({
                id: item.userId,
                name: item.firstName,
                avatarUrl: item.avatarUrl,
                city: item.city,
                cyclingLevel: null,
                ridingStyle: null,
                bio: null,
                reviews: [
                  {
                    id: `review-${item.userId}-1`,
                    authorName: 'Parea rider',
                    rating: 5,
                    comment: 'Friendly rider and easy to coordinate with.',
                  },
                ],
              }))}
              maxParticipants={activity.max_participants}
            />

            <View style={styles.bottomActions}>
              <Pressable
                onPress={() => void handleJoinFromHome(activity)}
                style={[styles.actionButton, styles.joinButton]}
              >
                <Text style={styles.joinText}>Join</Text>
              </Pressable>

              <Pressable
                onPress={() => handleSkip(index)}
                style={[styles.actionButton, styles.skipButton]}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>
          {error ?? 'No rides available yet.'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.brandHeader}>
        <Text style={styles.brandName}>Parea</Text>
      </View>

      <FlatList
        ref={listRef}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderRideCard}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{ paddingBottom: 0 }}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  brandHeader: {
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.6,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImage: {
    flex: 1,
  },
  cardImageInner: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardCircuit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardTime: {
    fontSize: 13,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeOpen: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeFull: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeCancelled: {
    backgroundColor: '#e5e5e5',
  },
  statusBadgeCompleted: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  spotsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 15, 28, 0.82)',
    marginBottom: 18,
    alignSelf: 'center',
    width: '92%',
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#22c55e',
  },
  skipButton: {
    backgroundColor: '#ffffff',
  },
  joinText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#08101c',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
})
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedActivityMeta, setSelectedActivityMeta] = useState<{
    participantCount: number
    cardStatus: string
  } | null>(null)

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
      void refreshParticipantPreviews()
    }, [refreshActivities, refreshParticipantPreviews])
  )

  const handleJoinFromHome = async (activity: Activity) => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to join a ride.')
      return
    }

    const participantCount =
      previewsByActivityId[activity.id]?.length ?? activity.participant_count ?? 0

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
      await refreshParticipantPreviews()
      router.push(`/activity/${activity.id}`)
    } catch (err: any) {
      Alert.alert('Join failed', err?.message ?? 'Unknown error')
    }
  }

  const handleOpenCircuitDetails = (activity: Activity) => {
    router.push(`/activity/${activity.id}`)
  }

  const handleSkip = (index: number) => {
    const nextIndex = index + 1
    if (nextIndex >= activities.length) return

    listRef.current?.scrollToOffset({
      offset: CARD_WIDTH * nextIndex,
      animated: true,
    })
  }

  const showCircuitInfo = (
    activity: Activity,
    participantCount: number,
    cardStatus: string
  ) => {
    setSelectedActivity(activity)
    setSelectedActivityMeta({ participantCount, cardStatus })
  }

  const closeCircuitInfo = () => {
    setSelectedActivity(null)
    setSelectedActivityMeta(null)
  }

  const renderRideCard = ({
    item: activity,
    index,
  }: {
    item: Activity
    index: number
  }) => {
    const participantCount =
      previewsByActivityId[activity.id]?.length ?? activity.participant_count ?? 0

    const cardStatus = getCardStatus(
      activity.status,
      participantCount,
      activity.max_participants
    )

    const imageUrl =
      activity.circuit?.cover_image_url ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'

    return (
      <View style={styles.card}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.topPeople}>
              <HomeRidePuzzleOverlay
                participants={(previewsByActivityId[activity.id] ?? []).map((item) => ({
                  id: item.userId,
                  name: item.firstName,
                  avatarUrl: item.avatarUrl,
                  city: item.city,
                  cyclingLevel: item.cyclingLevel,
                  ridingStyle: item.ridingStyle,
                  bio: item.bio,
                  reviews: [],
                  canReview:
                    !!userId &&
                    userId !== item.userId &&
                    (activity.status === 'completed' ||
                      new Date(activity.start_time).getTime() <= Date.now()),
                }))}
                maxParticipants={activity.max_participants}
                activityId={activity.id}
              />
            </View>

            <View style={styles.middleSpacer} />

            <View style={styles.bottomInfoWrap}>
              <Pressable
                onPress={() =>
                  showCircuitInfo(activity, participantCount, cardStatus)
                }
                style={styles.circuitInfoPress}
              >
                <Text style={styles.circuitNameText}>
                  {activity.circuit?.name ?? activity.title}
                  {activity.circuit ? `, ${activity.circuit.distance_km}km >` : ' >'}
                </Text>
              </Pressable>

              <Text style={styles.infoLineTop}>
                {activity.activity_type} · {cardStatus} · {participantCount} /{' '}
                {activity.max_participants} filled
              </Text>
            </View>

            <Pressable
              onPress={() => handleOpenCircuitDetails(activity)}
              style={styles.floatingPlusButton}
            >
              <Text style={styles.floatingPlusButtonText}>+</Text>
            </Pressable>

            <View style={styles.floatingActions}>
              <Pressable
                onPress={() => handleSkip(index)}
                style={[styles.circleActionSmall, styles.skipCircle]}
              >
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </Pressable>

              <Pressable
                onPress={() => void handleJoinFromHome(activity)}
                style={[styles.circleActionLarge, styles.joinCircle]}
              >
                <MaterialCommunityIcons name="bike" size={26} color="#08101c" />
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        <Modal
          visible={!!selectedActivity}
          transparent
          animationType="fade"
          onRequestClose={closeCircuitInfo}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.infoModalCard}>
              <Pressable onPress={closeCircuitInfo} style={styles.infoModalClose}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </Pressable>

              {selectedActivity ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.infoModalTitle}>
                    {selectedActivity.circuit?.name ?? selectedActivity.title}
                  </Text>

                  <Text style={styles.infoModalSubtitle}>
                    {selectedActivity.activity_type} ·{' '}
                    {selectedActivityMeta?.cardStatus ?? 'Open'} ·{' '}
                    {selectedActivityMeta?.participantCount ?? 0} /{' '}
                    {selectedActivity.max_participants} filled
                  </Text>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>City</Text>
                    <Text style={styles.infoValue}>{selectedActivity.city}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Difficulty</Text>
                    <Text style={styles.infoValue}>
                      {selectedActivity.circuit?.difficulty ?? '—'}
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Distance</Text>
                    <Text style={styles.infoValue}>
                      {selectedActivity.circuit?.distance_km ?? '—'} km
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Duration</Text>
                    <Text style={styles.infoValue}>
                      ~ {selectedActivity.circuit?.duration_min ?? '—'} min
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>
                      {formatRideDate(selectedActivity.start_time)}
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>
                      {selectedActivity.description ?? 'No description'}
                    </Text>
                  </View>
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
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
        disableIntervalMomentum
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  topPeople: {
    marginTop: 8,
    alignItems: 'center',
  },
  middleSpacer: {
    flex: 1,
  },
  bottomInfoWrap: {
    position: 'absolute',
    left: 12,
    right: 60,
    bottom: 90,
    alignItems: 'flex-start',
  },
  circuitInfoPress: {
    alignSelf: 'flex-start',
  },
  circuitNameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -0.2,
  },
  infoLineTop: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'left',
    marginTop: 6,
  },
  floatingPlusButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    zIndex: 25,
  },
  floatingPlusButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  floatingActions: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  circleActionSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  circleActionLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  skipCircle: {
    backgroundColor: '#0B1220',
  },
  joinCircle: {
    backgroundColor: '#22c55e',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  infoModalCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  infoModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    zIndex: 10,
  },
  infoModalTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    paddingRight: 52,
  },
  infoModalSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})
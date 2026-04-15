import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import PuzzleBoard from '../../components/puzzle/PuzzleBoard'
import { useActivity } from '../../hooks/useActivity'
import { useActivityParticipants } from '../../hooks/useActivityParticipants'
import { useAuth } from '../../hooks/useAuth'
import { useParticipantProfiles } from '../../hooks/useParticipantProfiles'
import { activityService } from '../../src/services/activityService'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function getDisplayStatus(
  status: string,
  participantCount: number,
  maxParticipants: number
) {
  if (status === 'cancelled') return 'Ride cancelled'
  if (status === 'completed') return 'Ride completed'
  if (status === 'full' || participantCount >= maxParticipants) return 'Ride is full'
  return 'Open'
}

export default function ActivityDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const activityId = params.id ?? null
  const router = useRouter()

  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const { activity, loading, error, refreshActivity } = useActivity(activityId)

  const {
    loading: participantsLoading,
    error: participantsError,
    participantCount,
    isJoined,
    join,
    leave,
    refreshParticipants,
  } = useActivityParticipants(activityId, userId)

  const {
    participantProfiles,
    loading: profilesLoading,
    error: profilesError,
    refreshParticipantProfiles,
  } = useParticipantProfiles(activityId)

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        refreshActivity(),
        refreshParticipants(),
        refreshParticipantProfiles(),
      ])
    } finally {
      setRefreshing(false)
    }
  }

  if (loading || participantsLoading || profilesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!activity) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Ride not found</Text>
      </View>
    )
  }

  const isHost = !!userId && activity.host_id === userId
  const isCancelled = activity.status === 'cancelled'
  const isCompleted = activity.status === 'completed'
  const isFull =
    activity.status === 'full' || participantCount >= activity.max_participants

  const canJoin = !!userId && !isJoined && !isCancelled && !isCompleted && !isFull
  const canLeave = !!userId && isJoined && !isHost
  const canCancel = !!userId && isHost && !isCancelled
  const canOpenChat = !!userId && isJoined

  const handleJoin = async () => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to join this ride.')
      return
    }

    if (isCancelled) {
      Alert.alert('Ride cancelled', 'This ride has been cancelled.')
      return
    }

    if (isCompleted) {
      Alert.alert('Ride completed', 'This ride is already completed.')
      return
    }

    if (isJoined) {
      Alert.alert('You joined this ride', 'You are already part of this ride.')
      return
    }

    if (isFull) {
      Alert.alert('Ride is full', 'This ride has reached max riders.')
      return
    }

    try {
      await join()
      await Promise.all([
        refreshActivity(),
        refreshParticipants(),
        refreshParticipantProfiles(),
      ])

      Alert.alert('Joined', 'You joined this ride successfully.')
    } catch (err: any) {
      Alert.alert('Join failed', err?.message ?? 'Unknown error')
    }
  }

  const handleLeave = async () => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to leave this ride.')
      return
    }

    if (!isJoined) {
      Alert.alert('Not joined', 'You are not part of this ride.')
      return
    }

    if (isHost) {
      Alert.alert(
        'Host cannot leave',
        'As the host, you can’t leave this ride. You can cancel it instead.'
      )
      return
    }

    try {
      await leave()
      await Promise.all([
        refreshActivity(),
        refreshParticipants(),
        refreshParticipantProfiles(),
      ])

      Alert.alert('Left ride', 'You left this ride successfully.')
    } catch (err: any) {
      Alert.alert('Leave failed', err?.message ?? 'Unknown error')
    }
  }

  const handleCancelRide = () => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to cancel this ride.')
      return
    }

    if (!isHost) {
      Alert.alert('Forbidden', 'Only the host can cancel this ride.')
      return
    }

    if (isCancelled) {
      Alert.alert('Ride cancelled', 'This ride is already cancelled.')
      return
    }

    Alert.alert('Cancel ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await activityService.cancelActivity(activity.id)
            await refreshActivity()
            Alert.alert('Cancelled', 'This ride has been cancelled.')
          } catch (err: any) {
            Alert.alert('Cancel failed', err?.message ?? 'Unknown error')
          }
        },
      },
    ])
  }

  const handleOpenChat = () => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to access the chat.')
      return
    }

    if (!isJoined) {
      Alert.alert('Join required', 'Join this ride to access the chat.')
      return
    }

    router.push({
      pathname: '/group/[id]',
      params: { id: activity.id },
    })
  }

  const joinButtonLabel = isCancelled
    ? 'Ride cancelled'
    : isCompleted
      ? 'Ride completed'
      : isJoined
        ? 'You joined this ride'
        : isFull
          ? 'Ride is full'
          : 'Join ride'

  const openChatLabel = canOpenChat ? 'Open chat' : 'Join ride to access chat'

  const heroImageUrl =
    activity.circuit?.cover_image_url ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.heroCard}>
        <Image source={{ uri: heroImageUrl }} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.heroOverlay}>
          <View style={styles.heroTopRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{activity.activity_type}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isCancelled
                  ? styles.statusBadgeCancelled
                  : isFull
                    ? styles.statusBadgeFull
                    : styles.statusBadgeOpen,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getDisplayStatus(
                  activity.status,
                  participantCount,
                  activity.max_participants
                )}
              </Text>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{activity.title}</Text>

            <Text style={styles.heroMeta}>
              {activity.circuit
                ? `${activity.circuit.name} · ${activity.circuit.difficulty} · ${activity.circuit.distance_km} km`
                : activity.city}
            </Text>

            <Text style={styles.heroMetaSecondary}>
              {formatDate(activity.start_time)}
            </Text>
          </View>
        </View>
      </View>

      {isHost ? (
        <View style={styles.hostBadge}>
          <Text style={styles.hostBadgeText}>You’re hosting this ride</Text>
        </View>
      ) : null}

      <PuzzleBoard
        participants={participantProfiles.map((item) => ({
          id: item.user_id,
          name: item.profile?.first_name ?? null,
          avatarUrl: item.profile?.avatar_url ?? null,
          city: item.profile?.city ?? null,
          cyclingLevel: item.profile?.cycling_level ?? null,
          ridingStyle: item.profile?.riding_style ?? null,
          bio: item.profile?.bio ?? null,
          reviews: [],
          canReview:
            !!userId &&
            userId !== item.user_id &&
            activity.status === 'completed',
        }))}
        maxParticipants={activity.max_participants}
        title="Complete the team"
        emptyText="Be the first rider"
        partialText={`${participantCount} / ${activity.max_participants} spots filled`}
        fullText="Team complete"
        activityId={activity.id}
      />

      <Text style={styles.teamHint}>
        {isFull
          ? 'This ride is complete.'
          : isHost
            ? 'You started this team.'
            : isJoined
              ? 'You are part of this team.'
              : 'Your place is waiting.'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ride info</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>City</Text>
          <Text style={styles.value}>{activity.city}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Start time</Text>
          <Text style={styles.value}>{formatDate(activity.start_time)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Riders</Text>
          <Text style={styles.value}>
            {participantCount} / {activity.max_participants}
          </Text>
        </View>

        {activity.circuit ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Circuit</Text>
              <Text style={styles.value}>{activity.circuit.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Difficulty</Text>
              <Text style={styles.value}>{activity.circuit.difficulty}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{activity.circuit.distance_km} km</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>~ {activity.circuit.duration_min} min</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.labelBlock}>Description</Text>
        <Text style={styles.descriptionText}>{activity.description ?? '—'}</Text>
      </View>

      {participantsError ? <Text style={styles.errorText}>{participantsError}</Text> : null}
      {profilesError ? <Text style={styles.errorText}>{profilesError}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Riders</Text>

        {participantProfiles.length === 0 ? (
          <Text style={styles.value}>No riders yet</Text>
        ) : (
          participantProfiles.map((participant) => (
            <View key={participant.participant_id} style={styles.participantRow}>
              {participant.profile?.avatar_url ? (
                <Image
                  source={{ uri: participant.profile.avatar_url }}
                  style={styles.participantAvatar}
                />
              ) : (
                <View style={[styles.participantAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {participant.profile?.first_name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}

              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {participant.profile?.first_name ?? 'Unknown'}
                </Text>
                <Text style={styles.participantMeta}>
                  {participant.profile?.city ?? 'No city'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsColumn}>
        <Pressable
          onPress={handleJoin}
          disabled={!canJoin}
          style={[styles.joinButton, !canJoin && styles.joinButtonDisabled]}
        >
          <Text style={styles.joinButtonText}>{joinButtonLabel}</Text>
        </Pressable>

        <Pressable
          onPress={handleOpenChat}
          disabled={!canOpenChat}
          style={[styles.groupButton, !canOpenChat && styles.groupButtonDisabled]}
        >
          <Text style={styles.groupButtonText}>{openChatLabel}</Text>
        </Pressable>

        {isJoined ? (
          <Pressable
            onPress={handleLeave}
            disabled={!canLeave}
            style={[styles.leaveButton, !canLeave && styles.leaveButtonDisabled]}
          >
            <Text style={styles.leaveButtonText}>
              {isHost ? 'Host cannot leave' : 'Leave ride'}
            </Text>
          </Pressable>
        ) : null}

        {isHost ? (
          <Pressable
            onPress={handleCancelRide}
            disabled={!canCancel}
            style={[styles.cancelButton, !canCancel && styles.cancelButtonDisabled]}
          >
            <Text style={styles.cancelButtonText}>
              {isCancelled ? 'Ride cancelled' : 'Cancel ride'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
  },
  heroCard: {
    height: 290,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroBottom: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  heroMeta: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  heroMetaSecondary: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeBadgeText: {
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  hostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  hostBadgeText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  teamHint: {
    fontSize: 14,
    color: '#475569',
    marginTop: -4,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  labelBlock: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 8,
  },
  value: {
    flexShrink: 1,
    fontSize: 16,
    color: '#111827',
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    textAlign: 'left',
  },
  participantRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  participantMeta: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  actionsColumn: {
    gap: 12,
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#08101c',
  },
  groupButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  groupButtonDisabled: {
    opacity: 0.7,
  },
  groupButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    opacity: 0.7,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#111827',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
})
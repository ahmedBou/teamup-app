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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>Ride details</Text>

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
        }))}
        maxParticipants={activity.max_participants}
        title="Complete the team"
        emptyText="Be the first rider"
        partialText={`${participantCount} / ${activity.max_participants} spots filled`}
        fullText="Team complete"
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
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{activity.activity_type}</Text>

        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>{activity.city}</Text>

        <Text style={styles.label}>Start time</Text>
        <Text style={styles.value}>{formatDate(activity.start_time)}</Text>

        <Text style={styles.label}>Riders</Text>
        <Text style={styles.value}>
          {participantCount} / {activity.max_participants}
        </Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>
          {getDisplayStatus(
            activity.status,
            participantCount,
            activity.max_participants
          )}
        </Text>

        <Text style={styles.label}>Circuit</Text>
        {activity.circuit ? (
          <View style={styles.circuitCard}>
            {activity.circuit.cover_image_url ? (
              <Image
                source={{ uri: activity.circuit.cover_image_url }}
                style={styles.circuitImage}
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.circuitTitle}>{activity.circuit.name}</Text>
            <Text style={styles.circuitMeta}>
              {activity.circuit.city} · {activity.circuit.difficulty}
            </Text>
            <Text style={styles.circuitMeta}>
              {activity.circuit.distance_km} km · ~ {activity.circuit.duration_min} min
            </Text>
          </View>
        ) : (
          <Text style={styles.value}>No circuit selected</Text>
        )}

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{activity.description ?? '—'}</Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
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
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginTop: 6,
  },
  value: {
    fontSize: 16,
    color: '#111',
  },
  participantRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  participantMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
  },
  groupButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  groupButtonDisabled: {
    opacity: 0.7,
  },
  groupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    opacity: 0.7,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
  teamHint: {
    fontSize: 14,
    color: '#475569',
    marginTop: -4,
  },
  circuitCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  circuitImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  circuitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  circuitMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748b',
  },
})
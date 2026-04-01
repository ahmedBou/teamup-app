import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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

export default function ActivityDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const activityId = params.id ?? null
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const router = useRouter()

  const { activity, loading, error } = useActivity(activityId)

  const {
    participants,
    loading: participantsLoading,
    error: participantsError,
    participantCount,
    isJoined,
    join,
    leave,
  } = useActivityParticipants(activityId, userId)

  const {
    participantProfiles,
    loading: profilesLoading,
    error: profilesError,
    refreshParticipantProfiles,
  } = useParticipantProfiles(activityId)

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
        <Text style={styles.emptyText}>Activity not found</Text>
      </View>
    )
  }

  const isFull = participantCount >= activity.max_participants
  const isHost = !!userId && activity.host_id === userId
  const isCancelled = activity.status === 'cancelled'

  const handleJoin = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in')
      return
    }

    if (isCancelled) {
      Alert.alert('Cancelled', 'This activity has been cancelled')
      return
    }

    if (isJoined) {
      Alert.alert('Already joined', 'You are already part of this activity')
      return
    }

    if (isFull) {
      Alert.alert('Activity full', 'This activity has reached max participants')
      return
    }

    try {
      await join()
      await refreshParticipantProfiles()

      const newCount = participantCount + 1

      if (newCount >= activity.max_participants) {
        await activityService.updateActivityStatus(activity.id, 'full')
      }

      Alert.alert('Joined', 'You joined the activity successfully')
    } catch (err: any) {
      Alert.alert('Join failed', err?.message ?? 'Unknown error')
    }
  }

  const handleLeave = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in')
      return
    }

    if (!isJoined) {
      Alert.alert('Not joined', 'You are not part of this activity')
      return
    }

    if (isHost) {
      Alert.alert(
        'Host cannot leave',
        'As host, you cannot leave your own activity in this MVP. You must cancel it later.'
      )
      return
    }

    try {
      await leave()
      await refreshParticipantProfiles()

      const newCount = participantCount - 1

      if (newCount < activity.max_participants) {
        await activityService.updateActivityStatus(activity.id, 'open')
      }

      Alert.alert('Left activity', 'You left the activity successfully')
    } catch (err: any) {
      Alert.alert('Leave failed', err?.message ?? 'Unknown error')
    }
  }

  const handleCancelActivity = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in')
      return
    }

    if (!isHost) {
      Alert.alert('Forbidden', 'Only the host can cancel this activity')
      return
    }

    Alert.alert(
      'Cancel activity',
      'Are you sure you want to cancel this activity?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await activityService.cancelActivity(activity.id)
              Alert.alert('Cancelled', 'The activity has been cancelled')
            } catch (err: any) {
              Alert.alert('Cancel failed', err?.message ?? 'Unknown error')
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>Activity details</Text>

      {isHost ? (
        <View style={styles.hostBadge}>
          <Text style={styles.hostBadgeText}>You are the host</Text>
        </View>
      ) : null}

      <PuzzleBoard
        participants={participantProfiles.map((item) => ({
          id: item.user_id,
          name: item.profile?.first_name ?? null,
          avatarUrl: item.profile?.avatar_url ?? null,
        }))}
        maxParticipants={activity.max_participants}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{activity.activity_type}</Text>

        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>{activity.city}</Text>

        <Text style={styles.label}>Start time</Text>
        <Text style={styles.value}>{formatDate(activity.start_time)}</Text>

        <Text style={styles.label}>Participants</Text>
        <Text style={styles.value}>
          {participantCount} / {activity.max_participants}
        </Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{isCancelled ? 'cancelled' : isFull ? 'full' : activity.status}</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{activity.description ?? '—'}</Text>
      </View>

      {participantsError ? <Text style={styles.errorText}>{participantsError}</Text> : null}
      {profilesError ? <Text style={styles.errorText}>{profilesError}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Participants</Text>

        {participantProfiles.length === 0 ? (
          <Text style={styles.value}>No participants yet</Text>
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
                  {participant.profile?.email ?? 'No email'}
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
        disabled={isJoined || isFull || isCancelled}
        style={[
          styles.joinButton,
          (isJoined || isFull || isCancelled) && styles.joinButtonDisabled,
        ]}
      >
        <Text style={styles.joinButtonText}>
          {isCancelled
            ? 'Activity cancelled'
            : isJoined
            ? 'Already joined'
            : isFull
            ? 'Activity full'
            : 'Join activity'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push({
            pathname: '/group/[id]',
            params: { id: activity.id },
          })
        }
        style={styles.groupButton}
      >
        <Text style={styles.groupButtonText}>Open group</Text>
      </Pressable>

      {isJoined ? (
        <Pressable
          onPress={handleLeave}
          style={[styles.leaveButton, isHost && styles.leaveButtonDisabled]}
        >
          <Text style={styles.leaveButtonText}>
            {isHost ? 'Host cannot leave' : 'Leave activity'}
          </Text>
        </Pressable>
      ) : null}

      {isHost ? (
        <Pressable onPress={handleCancelActivity} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel activity</Text>
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
})
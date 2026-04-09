import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import PuzzleBoard from '../../components/puzzle/PuzzleBoard'
import { useActivity } from '../../hooks/useActivity'
import { useAuth } from '../../hooks/useAuth'
import { useMessages } from '../../hooks/useMessages'
import { useParticipantProfiles } from '../../hooks/useParticipantProfiles'
import { notificationService } from '../../src/services/notificationService'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export default function GroupScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const activityId = params.id ?? null

  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const {
    activity,
    loading: activityLoading,
    error: activityError,
  } = useActivity(activityId)

  const {
    participantProfiles,
    loading: participantsLoading,
    error: participantsError,
    refreshParticipantProfiles,
  } = useParticipantProfiles(activityId)

  const isParticipant =
    !!userId && participantProfiles.some((participant) => participant.user_id === userId)

  const canAccessChat = !!userId && isParticipant

  useEffect(() => {
  if (!activityId || !canAccessChat) return

  void notificationService.markMessageNotificationsAsReadForActivity(activityId)
}, [activityId, canAccessChat])

  const {
    messages,
    loading: messagesLoading,
    refreshing: messagesRefreshing,
    error: messagesError,
    refreshMessages,
    sendMessage,
  } = useMessages(activityId, userId, canAccessChat)

  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  const handleRefresh = async () => {
    try {
      if (canAccessChat) {
        await Promise.all([refreshParticipantProfiles(), refreshMessages()])
      } else {
        await refreshParticipantProfiles()
      }
    } catch {
      // les erreurs sont déjà gérées dans les hooks
    }
  }

  const handleSend = async () => {
    if (!canAccessChat) {
      Alert.alert('Access denied', 'Join this ride to use the chat.')
      return
    }

    const trimmed = messageText.trim()

    if (!trimmed) return

    try {
      setSending(true)
      await sendMessage(trimmed)
      setMessageText('')
    } catch (error: any) {
      Alert.alert('Send failed', error?.message ?? 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  if (activityLoading || participantsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (activityError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{activityError}</Text>
      </View>
    )
  }

  if (!activity) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Group not found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={canAccessChat ? messagesRefreshing : false}
          onRefresh={handleRefresh}
        />
      }
    >
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>Chat with the group</Text>

      <PuzzleBoard
        participants={participantProfiles.map((item) => ({
          id: item.user_id,
          name: item.profile?.first_name ?? null,
          avatarUrl: item.profile?.avatar_url ?? null,
        }))}
        maxParticipants={activity.max_participants}
      />

      <View style={styles.card}>
        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>{activity.city}</Text>

        <Text style={styles.label}>Start time</Text>
        <Text style={styles.value}>{formatDate(activity.start_time)}</Text>

        <Text style={styles.label}>Riders</Text>
        <Text style={styles.value}>
          {participantProfiles.length} / {activity.max_participants}
        </Text>
      </View>

      {participantsError ? <Text style={styles.errorText}>{participantsError}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Riders</Text>

        {participantProfiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No riders yet</Text>
            <Text style={styles.emptySubtitle}>
              People who join this ride will appear here.
            </Text>
          </View>
        ) : (
          participantProfiles.map((participant) => (
            <View key={participant.participant_id} style={styles.participantRow}>
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {participant.profile?.first_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>

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

      <View style={styles.card}>
        <View style={styles.chatHeaderRow}>
          <Text style={styles.sectionTitle}>Chat</Text>

          {canAccessChat ? (
            <Pressable style={styles.refreshSmallButton} onPress={handleRefresh}>
              <Text style={styles.refreshSmallButtonText}>Refresh</Text>
            </Pressable>
          ) : null}
        </View>

        {!userId ? (
          <View style={styles.restrictedBox}>
            <Text style={styles.emptyTitle}>Login required</Text>
            <Text style={styles.emptySubtitle}>
              You need to be logged in to access the group chat.
            </Text>
          </View>
        ) : !canAccessChat ? (
          <View style={styles.restrictedBox}>
            <Text style={styles.emptyTitle}>Chat locked</Text>
            <Text style={styles.emptySubtitle}>
              Join this ride to read and send messages in the group chat.
            </Text>
          </View>
        ) : messagesLoading ? (
          <View style={styles.chatStateBox}>
            <ActivityIndicator />
            <Text style={styles.chatStateText}>Loading chat...</Text>
          </View>
        ) : messagesError ? (
          <View style={styles.chatStateBox}>
            <Text style={styles.errorText}>{messagesError}</Text>
            <Pressable style={styles.retryButton} onPress={refreshMessages}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Say hi and start the conversation.
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isMine = message.user_id === userId

            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isMine ? styles.myMessageBubble : styles.otherMessageBubble,
                ]}
              >
                <Text style={styles.messageAuthor}>
                  {isMine ? 'You' : message.author?.first_name ?? 'Unknown'}
                </Text>

                <Text style={styles.messageText}>{message.content}</Text>

                <Text style={styles.messageMeta}>
                  {formatDate(message.created_at)}
                </Text>
              </View>
            )
          })
        )}

        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={
            canAccessChat ? 'Write to the group...' : 'Join the ride to use the chat'
          }
          editable={canAccessChat && !sending}
          multiline
          style={[styles.input, !canAccessChat && styles.inputDisabled]}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canAccessChat || sending || !messageText.trim()}
          style={[
            styles.sendButton,
            (!canAccessChat || sending || !messageText.trim()) &&
              styles.sendButtonDisabled,
          ]}
        >
          <Text style={styles.sendButtonText}>
            {sending ? 'Sending...' : 'Send'}
          </Text>
        </Pressable>
      </View>
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
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 10,
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
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 16,
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
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshSmallButton: {
    backgroundColor: '#0B1220',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshSmallButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  chatStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  chatStateText: {
    fontSize: 15,
    color: '#666',
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fff',
  },
  restrictedBox: {
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fff7ed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
  },
  messageBubble: {
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  myMessageBubble: {
    backgroundColor: '#dcfce7',
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  messageText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  messageMeta: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 90,
    textAlignVertical: 'top',
    marginTop: 10,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
  },
  retryButton: {
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
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
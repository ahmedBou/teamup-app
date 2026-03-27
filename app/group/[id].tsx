import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
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

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export default function GroupScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const activityId = params.id ?? null
  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const { activity, loading: activityLoading, error: activityError } = useActivity(activityId)
  const {
    participantProfiles,
    loading: participantsLoading,
    error: participantsError,
  } = useParticipantProfiles(activityId)

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
  } = useMessages(activityId, userId)

  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!messageText.trim()) return

    try {
      setSending(true)
      await sendMessage(messageText)
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>Group screen</Text>

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

        <Text style={styles.label}>Participants</Text>
        <Text style={styles.value}>
          {participantProfiles.length} / {activity.max_participants}
        </Text>
      </View>

      {participantsError ? <Text style={styles.errorText}>{participantsError}</Text> : null}
      {messagesError ? <Text style={styles.errorText}>{messagesError}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Participants</Text>

        {participantProfiles.length === 0 ? (
          <Text style={styles.value}>No participants yet</Text>
        ) : (
          participantProfiles.map((participant) => (
            <View key={participant.participant_id} style={styles.participantRow}>
              <Text style={styles.participantName}>
                {participant.profile?.first_name ?? 'Unknown'}
              </Text>
              <Text style={styles.participantMeta}>
                {participant.profile?.city ?? 'No city'}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Chat</Text>

        {messages.length === 0 ? (
          <Text style={styles.value}>No messages yet</Text>
        ) : (
                messages.map((message) => (
                    <View key={message.id} style={styles.messageBubble}>
                        <Text style={styles.messageAuthor}>
                        {message.user_id === userId
                            ? 'You'
                            : message.author?.first_name ?? 'Unknown'}
                        </Text>
                        <Text style={styles.messageText}>{message.content}</Text>
                        <Text style={styles.messageMeta}>{formatDate(message.created_at)}</Text>
                    </View>

          ))
        )}

        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Write a message..."
          style={styles.input}
          multiline
        />

        <Pressable
          onPress={handleSend}
          disabled={sending}
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
        >
          <Text style={styles.sendButtonText}>
            {sending ? 'Sending...' : 'Send message'}
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
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
  messageBubble: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  messageText: {
    fontSize: 15,
    color: '#111',
    marginTop: 4,
    lineHeight: 22,
  },
  messageMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
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
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
})
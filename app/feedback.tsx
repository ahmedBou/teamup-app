import { Redirect } from 'expo-router'
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
import { useAuth } from '../hooks/useAuth'
import {
    feedbackService,
    type FeedbackCategory,
} from '../src/services/feedbackService'

export default function FeedbackScreen() {
  const { session, loading: authLoading } = useAuth()
  const userId = session?.user?.id ?? null

  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [message, setMessage] = useState('')
  const [screen, setScreen] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!session || !userId) {
    return <Redirect href="/" />
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Missing feedback', 'Please write a short message before sending.')
      return
    }

    try {
      setSubmitting(true)

      await feedbackService.submitFeedback({
        user_id: userId,
        category,
        message,
        screen: screen.trim() || null,
      })

      setMessage('')
      setScreen('')

      Alert.alert('Thanks', 'Your feedback has been sent.')
    } catch (err: any) {
      Alert.alert('Send failed', err?.message ?? 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Feedback</Text>
      <Text style={styles.subtitle}>
        Tell us what felt broken, confusing, or missing.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>

        <View style={styles.optionRow}>
          {(['bug', 'idea', 'ux', 'other'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.optionButton,
                category === item && styles.optionButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  category === item && styles.optionButtonTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Screen or page</Text>
        <TextInput
          value={screen}
          onChangeText={setScreen}
          placeholder="Example: Activity Details, Group Chat, Discover"
          style={styles.input}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="What happened? What would you improve?"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !message.trim()}
        style={[
          styles.submitButton,
          (submitting || !message.trim()) && styles.submitButtonDisabled,
        ]}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Sending...' : 'Submit feedback'}
        </Text>
      </Pressable>
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
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
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
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#0B1220',
    borderColor: '#0B1220',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    textTransform: 'capitalize',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
  },
})
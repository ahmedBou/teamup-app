import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { activityService } from '../../src/services/activityService'
import type { ActivityType } from '../../src/types/activity'

const activityTypes: ActivityType[] = [
  'road_ride',
  'mtb_ride',
  'gravel_ride',
  'casual_ride',
]

export default function CreateActivityScreen() {
  const router = useRouter()
  const { session } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityType, setActivityType] = useState<ActivityType>('road_ride')
  const [city, setCity] = useState('')
  const [startTime, setStartTime] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('6')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const hostId = session?.user?.id

    if (!hostId) {
      Alert.alert('Error', 'No authenticated user found')
      return
    }

    if (!title.trim()) {
      Alert.alert('Missing info', 'Please enter a title')
      return
    }

    if (!city.trim()) {
      Alert.alert('Missing info', 'Please enter a city')
      return
    }

    if (!startTime.trim()) {
      Alert.alert(
        'Missing info',
        'Please enter a start time in this format: 2026-03-30T09:00:00'
      )
      return
    }

    const parsedMax = Number(maxParticipants)

    if (!Number.isInteger(parsedMax) || parsedMax < 2) {
      Alert.alert('Invalid value', 'Max participants must be a number greater than 1')
      return
    }

    try {
      setSaving(true)

      await activityService.createActivity({
        host_id: hostId,
        title: title.trim(),
        description: description.trim() || null,
        activity_type: activityType,
        city: city.trim(),
        start_time: new Date(startTime).toISOString(),
        max_participants: parsedMax,
      })

      Alert.alert('Success', 'Activity created successfully')
      router.replace('/(tabs)/home')
    } catch (error: any) {
      console.error('Create activity error:', error)
      Alert.alert('Create failed', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create activity</Text>
      <Text style={styles.subtitle}>Publish a new local cycling activity.</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Sunday MTB ride"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Easy local ride"
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Activity type</Text>
        <View style={styles.chipsWrap}>
          {activityTypes.map((type) => {
            const selected = activityType === type
            return (
              <Pressable
                key={type}
                onPress={() => setActivityType(type)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {type}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Temara"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Start time</Text>
        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="2026-03-30T09:00:00"
          style={styles.input}
        />
        <Text style={styles.helperText}>
          Use ISO format for now, for example: 2026-03-30T09:00:00
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Max participants</Text>
        <TextInput
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          placeholder="6"
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <Pressable
        onPress={handleCreate}
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Creating...' : 'Create activity'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 18,
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
  section: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
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
    minHeight: 110,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#0B1220',
    borderColor: '#0B1220',
  },
  chipText: {
    fontSize: 14,
    color: '#222',
  },
  chipTextSelected: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
  },
})
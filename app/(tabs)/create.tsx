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

function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function isValidTime(time: string) {
  return /^\d{2}:\d{2}$/.test(time)
}

function buildIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

export default function CreateActivityScreen() {
  const router = useRouter()
  const { session } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityType, setActivityType] = useState<ActivityType>('road_ride')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
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

    if (!date.trim()) {
      Alert.alert('Missing info', 'Please enter a date')
      return
    }

    if (!time.trim()) {
      Alert.alert('Missing info', 'Please enter a time')
      return
    }

    if (!isValidDate(date.trim())) {
      Alert.alert('Invalid date', 'Use this format: 2026-04-05')
      return
    }

    if (!isValidTime(time.trim())) {
      Alert.alert('Invalid time', 'Use this format: 09:30')
      return
    }

    const parsedMax = Number(maxParticipants)

    if (!Number.isInteger(parsedMax) || parsedMax < 2) {
      Alert.alert('Invalid value', 'Max participants must be a number greater than 1')
      return
    }

    try {
      setSaving(true)

      const startTimeIso = buildIsoDateTime(date.trim(), time.trim())

      await activityService.createActivity({
        host_id: hostId,
        title: title.trim(),
        description: description.trim() || null,
        activity_type: activityType,
        city: city.trim(),
        start_time: startTimeIso,
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

      <View style={styles.row}>
        <View style={[styles.section, styles.halfWidth]}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2026-04-05"
            style={styles.input}
          />
          <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
        </View>

        <View style={[styles.section, styles.halfWidth]}>
          <Text style={styles.label}>Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="09:30"
            style={styles.input}
          />
          <Text style={styles.helperText}>Format: HH:MM</Text>
        </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
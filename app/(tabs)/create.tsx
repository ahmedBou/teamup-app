import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { circuitService } from '../../src/services/circuitService'
import type { Circuit } from '../../src/types/circuit'

type ActivityType = 'road_ride' | 'mtb_ride' | 'gravel_ride' | 'casual_ride'

const activityTypeOptions: { value: ActivityType; label: string }[] = [
  { value: 'road_ride', label: 'Road ride' },
  { value: 'mtb_ride', label: 'MTB ride' },
  { value: 'gravel_ride', label: 'Gravel ride' },
  { value: 'casual_ride', label: 'Casual ride' },
]

export default function CreateActivityScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Temara')
  const [activityType, setActivityType] = useState<ActivityType>('road_ride')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('6')
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | null>(null)

  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [circuitsLoading, setCircuitsLoading] = useState(false)
  const [circuitsError, setCircuitsError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const selectedCircuit = useMemo(
    () => circuits.find((circuit) => circuit.id === selectedCircuitId) ?? null,
    [circuits, selectedCircuitId]
  )

  const loadCircuits = useCallback(async () => {
    try {
      setCircuitsLoading(true)
      setCircuitsError(null)

      const data = await circuitService.listActiveCircuits()
      setCircuits(data)

      setSelectedCircuitId((currentId) => {
        if (!currentId) return currentId
        const stillExists = data.some((circuit) => circuit.id === currentId)
        return stillExists ? currentId : null
      })
    } catch (err: any) {
      setCircuitsError(err?.message ?? 'Unable to load circuits.')
    } finally {
      setCircuitsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCircuits()
  }, [loadCircuits])

  useFocusEffect(
    useCallback(() => {
      void loadCircuits()
    }, [loadCircuits])
  )

  const handleCreateActivity = async () => {
    if (!userId) {
      Alert.alert('Login required', 'You must be logged in to create a ride.')
      return
    }

    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a ride title.')
      return
    }

    if (!city.trim()) {
      Alert.alert('Missing city', 'Please enter a city.')
      return
    }

    if (!date.trim()) {
      Alert.alert('Missing date', 'Please enter a date in YYYY-MM-DD format.')
      return
    }

    if (!time.trim()) {
      Alert.alert('Missing time', 'Please enter a time in HH:MM format.')
      return
    }

    if (!selectedCircuitId) {
      Alert.alert('Missing circuit', 'Please choose a circuit.')
      return
    }

    const parsedMaxParticipants = Number(maxParticipants)
    if (!Number.isFinite(parsedMaxParticipants) || parsedMaxParticipants < 2) {
      Alert.alert('Invalid riders', 'Max participants must be at least 2.')
      return
    }

    const startTime = new Date(`${date}T${time}:00`)
    if (Number.isNaN(startTime.getTime())) {
      Alert.alert(
        'Invalid date or time',
        'Please use YYYY-MM-DD for date and HH:MM for time.'
      )
      return
    }

    try {
      setSubmitting(true)

      const activity = await activityService.createActivity({
        host_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        activity_type: activityType,
        city: city.trim(),
        start_time: startTime.toISOString(),
        max_participants: parsedMaxParticipants,
        circuit_id: selectedCircuitId,
      })

      Alert.alert('Ride created', 'Your ride has been created successfully.', [
        {
          text: 'OK',
          onPress: () => {
            router.push(`/activity/${activity.id}`)
          },
        },
      ])
    } catch (err: any) {
      Alert.alert(
        'Creation failed',
        err?.message ?? 'Unable to create this activity.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Create activity</Text>
        <Text style={styles.subtitle}>
          Organize a new ride and let riders join your team.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ride title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Sunday morning ride"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Short description of the ride"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ride type</Text>
          <View style={styles.chipsRow}>
            {activityTypeOptions.map((option) => {
              const selected = activityType === option.value

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setActivityType(option.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Temara"
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2026-04-18"
              style={styles.input}
            />
          </View>

          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="07:00"
              style={styles.input}
            />
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.halfField]}>
          <Text style={styles.label}>Max riders</Text>
          <TextInput
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="6"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.circuitHeaderRow}>
          <Text style={styles.label}>Choose a circuit</Text>

          <Pressable
            onPress={() => router.push('/create-circuit')}
            style={styles.addCircuitButton}
          >
            <Text style={styles.addCircuitButtonText}>Create new circuit</Text>
          </Pressable>
        </View>

        {circuitsLoading ? (
          <Text style={styles.helperText}>Loading circuits...</Text>
        ) : circuitsError ? (
          <Text style={styles.errorText}>{circuitsError}</Text>
        ) : circuits.length === 0 ? (
          <Text style={styles.helperText}>No active circuits available yet.</Text>
        ) : (
          <View style={styles.circuitList}>
            {circuits.map((circuit) => {
              const selected = selectedCircuitId === circuit.id

              return (
                <Pressable
                  key={circuit.id}
                  onPress={() => {
                    setSelectedCircuitId(circuit.id)
                    setCity(circuit.city ?? city)
                  }}
                  style={[
                    styles.circuitCard,
                    selected && styles.circuitCardSelected,
                  ]}
                >
                  <Text style={styles.circuitName}>{circuit.name}</Text>
                  <Text style={styles.circuitMeta}>
                    {circuit.city} · {circuit.difficulty} · {circuit.distance_km} km
                  </Text>
                  <Text style={styles.circuitMeta}>~ {circuit.duration_min} min</Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {selectedCircuit ? (
          <View style={styles.selectedCircuitBox}>
            <Text style={styles.selectedCircuitTitle}>Selected circuit</Text>
            <Text style={styles.selectedCircuitText}>{selectedCircuit.name}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void handleCreateActivity()}
          disabled={submitting}
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Creating activity...' : 'Create activity'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 220,
    gap: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#0B1220',
    borderColor: '#0B1220',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  chipTextSelected: {
    color: '#fff',
  },
  circuitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  addCircuitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  addCircuitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  circuitList: {
    gap: 12,
  },
  circuitCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fafafa',
    gap: 4,
  },
  circuitCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  circuitName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  circuitMeta: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  selectedCircuitBox: {
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  selectedCircuitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  selectedCircuitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#08101c',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
})
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DatePickerModal, TimePickerModal } from '../../components/WheelPicker'
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

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`
}

function formatTimeInput(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function buildLocalDate(dateStr: string, timeStr: string) {
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/)

  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2]) - 1
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  const date = new Date(year, month, day, hour, minute, 0, 0)

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute

  return isValid ? date : null
}

function createTomorrowDefault() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(7, 0, 0, 0)
  return tomorrow
}

export default function CreateActivityScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const defaultDate = useMemo(() => createTomorrowDefault(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Temara')
  const [activityType, setActivityType] = useState<ActivityType>('road_ride')
  const [maxParticipants, setMaxParticipants] = useState('6')
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | null>(
    null
  )

  const [dateStr, setDateStr] = useState(formatDateInput(defaultDate))
  const [timeStr, setTimeStr] = useState(formatTimeInput(defaultDate))

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

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

  const openDatePicker = () => {
    setShowDatePicker(true)
  }

  const openTimePicker = () => {
    setShowTimePicker(true)
  }

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

    if (!selectedCircuitId) {
      Alert.alert('Missing circuit', 'Please choose a circuit.')
      return
    }

    const parsedDate = buildLocalDate(dateStr, timeStr)

    if (!parsedDate) {
      Alert.alert('Invalid date/time', 'Please choose a valid date and time.')
      return
    }

    if (parsedDate.getTime() <= Date.now()) {
      Alert.alert('Invalid date', 'The ride must be scheduled in the future.')
      return
    }

    const parsedMaxParticipants = Number(maxParticipants)

    if (!Number.isFinite(parsedMaxParticipants) || parsedMaxParticipants < 2) {
      Alert.alert('Invalid riders', 'Max riders must be at least 2.')
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
        start_time: parsedDate.toISOString(),
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
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Short description of the ride"
            placeholderTextColor="#64748b"
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
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
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
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.sectionTitle}>Ride schedule</Text>

          <View style={styles.scheduleBox}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.label}>Date</Text>

                <Pressable
                  onPress={openDatePicker}
                  style={styles.inputPressable}
                >
                  <Text style={styles.inputPressableText}>{dateStr}</Text>
                </Pressable>
              </View>

              <View style={styles.dateTimeColumn}>
                <Text style={styles.label}>Time</Text>

                <Pressable
                  onPress={openTimePicker}
                  style={styles.inputPressable}
                >
                  <Text style={styles.inputPressableText}>{timeStr}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Max riders</Text>

          <TextInput
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="number-pad"
            placeholder="6"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        <View style={styles.circuitHeader}>
          <Text style={styles.sectionTitle}>Choose a circuit</Text>

          <Pressable
            onPress={() => router.push('/create-circuit')}
            style={styles.createCircuitButton}
          >
            <Text style={styles.createCircuitButtonText}>
              Create new circuit
            </Text>
          </Pressable>
        </View>

        {circuitsLoading ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>Loading circuits...</Text>
          </View>
        ) : null}

        {circuitsError ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{circuitsError}</Text>

            <Pressable
              onPress={() => void loadCircuits()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!circuitsLoading && !circuitsError && circuits.length === 0 ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              No circuits available yet. Create a new circuit first.
            </Text>
          </View>
        ) : null}

        <View style={styles.circuitList}>
          {circuits.map((circuit) => {
            const selected = circuit.id === selectedCircuitId

            return (
              <Pressable
                key={circuit.id}
                onPress={() => setSelectedCircuitId(circuit.id)}
                style={[
                  styles.circuitCard,
                  selected && styles.circuitCardSelected,
                ]}
              >
                <View style={styles.circuitCardTopRow}>
                  <Text style={styles.circuitName}>{circuit.name}</Text>

                  {selected ? (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.circuitMeta}>
                  {circuit.city} · {circuit.difficulty} ·{' '}
                  {circuit.distance_km} km
                </Text>

                <Text style={styles.circuitMeta}>
                  ~ {circuit.duration_min} min
                </Text>
              </Pressable>
            )
          })}
        </View>

        {selectedCircuit ? (
          <Text style={styles.selectedCircuitHint}>
            Selected circuit: {selectedCircuit.name}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleCreateActivity()}
          disabled={submitting}
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Creating...' : 'Create activity'}
          </Text>
        </Pressable>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={dateStr}
        onConfirm={(val: string) => {
          setDateStr(val)
          setShowDatePicker(false)
        }}
        onClose={() => setShowDatePicker(false)}
      />

      <TimePickerModal
        visible={showTimePicker}
        value={timeStr}
        onConfirm={(val: string) => {
          setTimeStr(val)
          setShowTimePicker(false)
        }}
        onClose={() => setShowTimePicker(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 120,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 22,
  },

  fieldGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },

  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },

  chipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },

  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  chipTextSelected: {
    color: '#ffffff',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },

  scheduleBox: {
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  dateTimeColumn: {
    flex: 1,
  },

  inputPressable: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  inputPressableText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },

  circuitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  createCircuitButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },

  createCircuitButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563eb',
  },

  messageBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  messageText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },

  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '700',
    marginBottom: 10,
  },

  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0f172a',
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  circuitList: {
    gap: 12,
  },

  circuitCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
  },

  circuitCardSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },

  circuitCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    marginBottom: 6,
  },

  circuitName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },

  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },

  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  circuitMeta: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },

  selectedCircuitHint: {
    marginTop: 14,
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '800',
  },

  submitButton: {
    marginTop: 24,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '900',
  },
})
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
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
import { createCircuitFromGpx } from '../src/services/circuitService'
import type { CircuitDifficulty } from '../src/types/circuit'

const difficultyOptions: CircuitDifficulty[] = ['easy', 'medium', 'hard']

export default function CreateCircuitScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [city, setCity] = useState('Temara')
  const [difficulty, setDifficulty] = useState<CircuitDifficulty>('easy')
  const [durationMin, setDurationMin] = useState('75')
  const [elevationGain, setElevationGain] = useState('')
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [gpxText, setGpxText] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handlePickGpx = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/gpx+xml', 'text/xml', 'application/xml', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled) return

      const file = result.assets[0]
      let text = ''

      if (typeof window !== 'undefined') {
        const webFile = (file as any).file

        if (webFile && typeof webFile.text === 'function') {
          text = await webFile.text()
        } else {
          const response = await fetch(file.uri)
          text = await response.text()
        }
      } else {
        text = await FileSystem.readAsStringAsync(file.uri)
      }

      if (!text || !text.includes('<gpx')) {
        throw new Error('Selected file is not a valid GPX file.')
      }

      setSelectedFileName(file.name)
      setGpxText(text)
    } catch (err: any) {
      Alert.alert('Import failed', err?.message ?? 'Unable to read GPX file.')
    }
  }

  const handleCreateCircuit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a circuit name.')
      return
    }

    if (!city.trim()) {
      Alert.alert('Missing city', 'Please enter a city.')
      return
    }

    if (!durationMin.trim()) {
      Alert.alert('Missing duration', 'Please enter an estimated duration.')
      return
    }

    const parsedDuration = Number(durationMin)
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      Alert.alert('Invalid duration', 'Duration must be a positive number.')
      return
    }

    let parsedElevation: number | undefined = undefined
    if (elevationGain.trim()) {
      parsedElevation = Number(elevationGain)
      if (!Number.isFinite(parsedElevation) || parsedElevation < 0) {
        Alert.alert('Invalid elevation', 'Elevation gain must be a valid number.')
        return
      }
    }

    if (!gpxText) {
      Alert.alert('Missing GPX', 'Please import a GPX file first.')
      return
    }

    try {
      setSubmitting(true)

      const circuit = await createCircuitFromGpx({
        gpxText,
        name: name.trim(),
        city: city.trim(),
        difficulty,
        duration_min: parsedDuration,
        elevation_gain_m: parsedElevation,
      })

      Alert.alert('Circuit created', `${circuit.name} was created successfully.`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (err: any) {
      console.error('Create circuit error:', err)
      Alert.alert(
        'Creation failed',
        err?.message ?? 'Unable to create circuit from GPX.'
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
        <Text style={styles.title}>Create circuit</Text>
        <Text style={styles.subtitle}>
          Import a GPX file to create a reusable circuit for Parea.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Circuit name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Temara Forest Loop"
            style={styles.input}
          />
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.chipsRow}>
            {difficultyOptions.map((option) => {
              const selected = difficulty === option

              return (
                <Pressable
                  key={option}
                  onPress={() => setDifficulty(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              value={durationMin}
              onChangeText={setDurationMin}
              placeholder="75"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.label}>Elevation gain (optional)</Text>
            <TextInput
              value={elevationGain}
              onChangeText={setElevationGain}
              placeholder="320"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>GPX file</Text>

          <Pressable onPress={() => void handlePickGpx()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Import GPX</Text>
          </Pressable>

          <Text style={styles.fileHint}>
            {selectedFileName ? `Selected: ${selectedFileName}` : 'No GPX selected yet.'}
          </Text>
        </View>

        <Pressable
          onPress={() => void handleCreateCircuit()}
          disabled={submitting}
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Creating circuit...' : 'Create circuit'}
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
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  fileHint: {
    fontSize: 14,
    color: '#64748b',
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
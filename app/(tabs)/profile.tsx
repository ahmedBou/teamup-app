import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
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
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

export default function ProfileScreen() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null
  const router = useRouter()

  const { profile, loading, error, updateProfile } = useProfile(userId, email)

  const [firstName, setFirstName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [cyclingLevel, setCyclingLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'beginner'
  )
  const [ridingStyle, setRidingStyle] = useState<'road' | 'mtb' | 'gravel' | 'casual'>('road')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return

    setFirstName(profile.first_name ?? '')
    setCity(profile.city ?? '')
    setBio(profile.bio ?? '')
    setCyclingLevel(
      (profile.cycling_level as 'beginner' | 'intermediate' | 'advanced') ?? 'beginner'
    )
    setRidingStyle(
      (profile.riding_style as 'road' | 'mtb' | 'gravel' | 'casual') ?? 'road'
    )
  }, [profile])

  const handleSave = async () => {
    try {
      setSaving(true)

      await updateProfile({
        first_name: firstName.trim() || null,
        city: city.trim() || null,
        bio: bio.trim() || null,
        cycling_level: cyclingLevel,
        riding_style: ridingStyle,
        onboarding_completed: true,
      })

      Alert.alert('Saved', 'Your profile has been updated')
    } catch (err: any) {
      Alert.alert('Save failed', err?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Edit your rider profile</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.readonlyValue}>{profile?.email ?? email ?? '—'}</Text>

        <Text style={styles.label}>First name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          style={styles.input}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Enter your city"
          style={styles.input}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell riders a bit about yourself"
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Text style={styles.label}>Cycling level</Text>
        <View style={styles.optionRow}>
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <Pressable
              key={level}
              onPress={() => setCyclingLevel(level)}
              style={[
                styles.optionButton,
                cyclingLevel === level && styles.optionButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  cyclingLevel === level && styles.optionButtonTextSelected,
                ]}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Riding style</Text>
        <View style={styles.optionRow}>
          {(['road', 'mtb', 'gravel', 'casual'] as const).map((style) => (
            <Pressable
              key={style}
              onPress={() => setRidingStyle(style)}
              style={[
                styles.optionButton,
                ridingStyle === style && styles.optionButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  ridingStyle === style && styles.optionButtonTextSelected,
                ]}
              >
                {style}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save changes'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/feedback')}
        style={styles.feedbackButton}
      >
        <Text style={styles.feedbackButtonText}>Share feedback</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginTop: 6,
  },
  readonlyValue: {
    fontSize: 16,
    color: '#111',
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
    minHeight: 100,
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
  saveButton: {
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
  feedbackButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
})
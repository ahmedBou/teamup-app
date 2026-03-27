import { Redirect, useRouter } from 'expo-router'
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
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type { CyclingLevel, RidingStyle } from '../src/types/profile'

const cyclingLevels: CyclingLevel[] = ['beginner', 'intermediate', 'advanced']
const ridingStyles: RidingStyle[] = ['road', 'mtb', 'gravel', 'casual']

export default function OnboardingScreen() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const userId = session?.user?.id ?? null
  const { profile, loading: profileLoading, updateProfile } = useProfile(userId)

  const [firstName, setFirstName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [cyclingLevel, setCyclingLevel] = useState<CyclingLevel | null>(null)
  const [ridingStyle, setRidingStyle] = useState<RidingStyle | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '')
      setCity(profile.city ?? '')
      setBio(profile.bio ?? '')
      setCyclingLevel(profile.cycling_level ?? null)
      setRidingStyle(profile.riding_style ?? null)
    }
  }, [profile])

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'No authenticated user found')
      return
    }

    if (!firstName.trim()) {
      Alert.alert('Missing info', 'Please enter your first name')
      return
    }

    if (!city.trim()) {
      Alert.alert('Missing info', 'Please enter your city')
      return
    }

    if (!cyclingLevel) {
      Alert.alert('Missing info', 'Please choose your cycling level')
      return
    }

    if (!ridingStyle) {
      Alert.alert('Missing info', 'Please choose your riding style')
      return
    }

    try {
      setSaving(true)

      await updateProfile({
        first_name: firstName.trim(),
        city: city.trim(),
        bio: bio.trim() || null,
        cycling_level: cyclingLevel,
        riding_style: ridingStyle,
        onboarding_completed: true,
      })

      router.replace('/(tabs)/home')
    } catch (error: any) {
      console.error('Onboarding save error:', error)
      Alert.alert('Save failed', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/" />
  }

  if (profile?.onboarding_completed) {
    return <Redirect href="/(tabs)/home" />
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        Tell us a bit about your riding style so TeamUp can personalize your experience.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>First name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ahmed"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Temara"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Weekend rider, looking for local group rides..."
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Cycling level</Text>
        <View style={styles.chipsWrap}>
          {cyclingLevels.map((level) => {
            const selected = cyclingLevel === level
            return (
              <Pressable
                key={level}
                onPress={() => setCyclingLevel(level)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {level}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Riding style</Text>
        <View style={styles.chipsWrap}>
          {ridingStyles.map((style) => {
            const selected = ridingStyle === style
            return (
              <Pressable
                key={style}
                onPress={() => setRidingStyle(style)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {style}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save and continue'}
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
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
    textTransform: 'capitalize',
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
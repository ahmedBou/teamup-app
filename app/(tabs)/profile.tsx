import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../src/lib/supabase'
import {
  pickImageFromLibrary,
  uploadProfileAvatar,
} from '../../src/services/profileAvatarService'

type CyclingLevel = 'beginner' | 'intermediate' | 'advanced'
type RidingStyle = 'road' | 'mtb' | 'gravel' | 'casual'

type ProfileRow = {
  id: string
  first_name: string | null
  avatar_url: string | null
  city: string | null
  bio: string | null
  cycling_level: CyclingLevel | null
  riding_style: RidingStyle | null
  onboarding_completed: boolean
}

const cyclingLevelOptions: CyclingLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
]

const ridingStyleOptions: RidingStyle[] = [
  'road',
  'mtb',
  'gravel',
  'casual',
]

export default function ProfileScreen() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const email = session?.user?.email ?? null

  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [cyclingLevel, setCyclingLevel] = useState<CyclingLevel | null>(null)
  const [ridingStyle, setRidingStyle] = useState<RidingStyle | null>(null)

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          avatar_url,
          city,
          bio,
          cycling_level,
          riding_style,
          onboarding_completed
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      const nextProfile = (data ?? null) as ProfileRow | null
      setProfile(nextProfile)

      setFirstName(nextProfile?.first_name ?? '')
      setCity(nextProfile?.city ?? '')
      setBio(nextProfile?.bio ?? '')
      setCyclingLevel(nextProfile?.cycling_level ?? null)
      setRidingStyle(nextProfile?.riding_style ?? null)
    } catch (err: any) {
      Alert.alert('Profile error', err?.message ?? 'Unable to load profile.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleUploadAvatar = async () => {
    if (!userId) {
      Alert.alert('Login required', 'You need to be logged in.')
      return
    }

    try {
      const asset = await pickImageFromLibrary()
      if (!asset) return

      setUploadingAvatar(true)

      const publicUrl = await uploadProfileAvatar(userId, asset)

      setProfile((prev) =>
        prev
          ? { ...prev, avatar_url: publicUrl }
          : {
              id: userId,
              first_name: null,
              avatar_url: publicUrl,
              city: null,
              bio: null,
              cycling_level: null,
              riding_style: null,
              onboarding_completed: false,
            }
      )

      Alert.alert('Success', 'Profile photo updated.')
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Unable to upload photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert('Login required', 'You need to be logged in.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        first_name: firstName.trim() || null,
        city: city.trim() || null,
        bio: bio.trim() || null,
        cycling_level: cyclingLevel,
        riding_style: ridingStyle,
        onboarding_completed: true,
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)

      if (error) throw error

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : null
      )

      Alert.alert('Saved', 'Your profile has been updated.')
    } catch (err: any) {
      Alert.alert('Save failed', err?.message ?? 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => {
    const value = firstName.trim() || profile?.first_name?.trim() || 'R'
    return value.slice(0, 1).toUpperCase()
  }, [firstName, profile?.first_name])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Edit your rider identity.</Text>

      <View style={styles.card}>
        <View style={styles.avatarSection}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}

          <View style={styles.avatarActions}>
            <Text style={styles.avatarName}>{firstName.trim() || 'Rider'}</Text>
            <Text style={styles.avatarMeta}>{city.trim() || 'No city yet'}</Text>
            <Text style={styles.avatarMeta}>{email || 'No email'}</Text>

            <Pressable
              onPress={() => void handleUploadAvatar()}
              disabled={uploadingAvatar}
              style={[styles.avatarButton, uploadingAvatar && styles.buttonDisabled]}
            >
              <Text style={styles.avatarButtonText}>
                {uploadingAvatar
                  ? 'Uploading...'
                  : profile?.avatar_url
                    ? 'Change photo'
                    : 'Upload photo'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ahmed"
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
          <Text style={styles.label}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell riders a bit about yourself"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Cycling level</Text>
          <View style={styles.chipsRow}>
            {cyclingLevelOptions.map((option) => {
              const selected = cyclingLevel === option

              return (
                <Pressable
                  key={option}
                  onPress={() => setCyclingLevel(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {option}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Riding style</Text>
          <View style={styles.chipsRow}>
            {ridingStyleOptions.map((option) => {
              const selected = ridingStyle === option

              return (
                <Pressable
                  key={option}
                  onPress={() => setRidingStyle(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {option}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Pressable
          onPress={() => void handleSaveProfile()}
          disabled={saving}
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : 'Save profile'}
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
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 180,
    gap: 18,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 18,
    gap: 16,
    backgroundColor: '#fafafa',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e5e7eb',
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  avatarActions: {
    flex: 1,
    gap: 6,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  avatarMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  avatarButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  avatarButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
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
  primaryButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
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
import { useRouter } from 'expo-router'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../src/lib/supabase'

export default function ProfileScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const userId = session?.user?.id ?? null
  const { profile, loading } = useProfile(userId)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      return
    }

    router.replace('/')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Your TeamUp identity</Text>

      <View style={styles.avatarWrap}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>
              {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>First name</Text>
        <Text style={styles.value}>{profile?.first_name ?? '—'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email ?? '—'}</Text>

        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>{profile?.city ?? '—'}</Text>

        <Text style={styles.label}>Cycling level</Text>
        <Text style={styles.value}>{profile?.cycling_level ?? '—'}</Text>

        <Text style={styles.label}>Riding style</Text>
        <Text style={styles.value}>{profile?.riding_style ?? '—'}</Text>

        <Text style={styles.label}>Bio</Text>
        <Text style={styles.value}>{profile?.bio ?? '—'}</Text>
      </View>

      <Pressable style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Edit profile later</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
  avatarWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarFallback: {
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    backgroundColor: '#fafafa',
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d7d7d7',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
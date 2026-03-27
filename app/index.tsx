import { Redirect } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import WelcomeScreen from '../components/auth/WelcomeScreen'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { signInWithGoogle } from '../src/auth/signInWithGoogle'

export default function Index() {
  const { session, loading } = useAuth()
  const userId = session?.user?.id ?? null

  const {
    profile,
    loading: profileLoading,
    ensureProfile,
  } = useProfile(userId)

  useEffect(() => {
    if (session?.user?.id && !profile && !profileLoading) {
      ensureProfile()
    }
  }, [session?.user?.id, profile, profileLoading, ensureProfile])

  const handleGooglePress = async () => {
    try {
      const signedSession = await signInWithGoogle()
      console.log('Google sign-in session =', signedSession)
    } catch (error: any) {
      console.error(error)
      Alert.alert('Google sign-in failed', error?.message ?? 'Unknown error')
    }
  }

    console.log('session user id =', session?.user?.id)
  console.log('profile =', profile)
  console.log('profileLoading =', profileLoading)

  if (loading || (session && profileLoading)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B1220',
        }}
      >
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) {
    return (
      <WelcomeScreen
        onGooglePress={handleGooglePress}
        onApplePress={() => console.log('Apple')}
        onEmailPress={() => console.log('Email')}
      />
    )
  }

  if (!profile || !profile.onboarding_completed) {
    return <Redirect href="/onboarding" />
  }


  return <Redirect href="/(tabs)/home" />

}
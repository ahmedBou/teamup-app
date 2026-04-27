import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../../src/lib/supabase'

export default function AuthCallbackScreen() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function finishLogin() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      if (data.session) {
        router.replace('/(tabs)/home')
      } else {
        router.replace('/')
      }
    }

    finishLogin()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
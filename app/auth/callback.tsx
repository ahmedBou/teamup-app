import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function AuthCallbackScreen() {
  const router = useRouter()
  const url = Linking.useURL()

  useEffect(() => {
    console.log('Auth callback screen opened')
    console.log('Current callback URL:', url)

    if (url) {
      router.replace('/')
    }
  }, [url, router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
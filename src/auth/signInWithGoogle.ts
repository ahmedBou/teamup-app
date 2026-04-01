import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      throw error
    }

    return null
  }

  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'teamup',
    path: 'auth/callback',
  })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    throw error
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type !== 'success') {
    return null
  }

  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(result.url)

  if (exchangeError) {
    throw exchangeError
  }

  return sessionData.session
}
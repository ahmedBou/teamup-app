import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

function getQueryParams(url: string) {
  const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1])

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  }
}

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

    if (error) throw error

    return null
  }

  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'parea',
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

  if (error) throw error
  if (!data?.url) throw new Error('No Google OAuth URL returned')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type !== 'success') {
    return null
  }

  const {
    access_token,
    refresh_token,
    error: oauthError,
    error_description,
  } = getQueryParams(result.url)

  if (oauthError) {
    throw new Error(error_description || oauthError)
  }

  if (!access_token || !refresh_token) {
    throw new Error('Google sign-in failed: missing access token or refresh token')
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

  if (sessionError) throw sessionError

  return sessionData.session
}
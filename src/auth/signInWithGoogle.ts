import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../lib/supabase'

function extractParamsFromUrl(url: string) {
  const parsed = Linking.parse(url)
  const queryParams = parsed.queryParams ?? {}

  const hash = url.includes('#') ? url.split('#')[1] : ''
  const hashParams = Object.fromEntries(new URLSearchParams(hash))

  return {
    ...queryParams,
    ...hashParams,
  }
}

export async function signInWithGoogle() {
  const redirectTo = 'teamup://auth/callback'

  console.log('redirectTo =', redirectTo)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error) throw error
  if (!data?.url) throw new Error('Missing Google OAuth URL')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  console.log('Auth session result =', result)

  if (result.type !== 'success') {
    return null
  }

  const params = extractParamsFromUrl(result.url)
  console.log('Parsed callback params =', params)

  const access_token = String(params.access_token ?? '')
  const refresh_token = String(params.refresh_token ?? '')

  if (!access_token || !refresh_token) {
    throw new Error(
      `Missing access_token or refresh_token. Returned keys: ${Object.keys(params).join(', ')}`
    )
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })

  if (sessionError) throw sessionError

  return sessionData.session
}
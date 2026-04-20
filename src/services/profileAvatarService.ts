import { decode } from 'base64-arraybuffer'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

const BUCKET = 'profile-avatars'

type PickedAsset = {
  uri: string
  mimeType?: string
  base64?: string | null
}

export async function pickImageFromLibrary(): Promise<PickedAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (!permission.granted) {
    throw new Error('Media library permission is required.')
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  })

  if (result.canceled) return null

  const asset = result.assets[0]

  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    base64: asset.base64,
  }
}

export async function uploadProfileAvatar(userId: string, asset: PickedAsset) {
  if (!asset?.base64) {
    throw new Error('No image data found.')
  }

  const mimeType = asset.mimeType ?? 'image/jpeg'
  const ext =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg'

  const filePath = `${userId}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, decode(asset.base64), {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const publicUrl = data?.publicUrl

  if (!publicUrl) {
    throw new Error('Public URL unavailable. Check that the bucket is public.')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (profileError) {
    throw profileError
  }

  return publicUrl
}
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { supabase } from './supabase/client';

/**
 * Opens the image library, uploads the selected image to `{bucket}/{userId}/{prefix}-<ts>.<ext>`,
 * and returns its public URL. Returns null if the user cancels or denies gallery permission.
 */
export async function pickAndUploadImage(
  bucket: string,
  userId: string,
  prefix: string,
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload an image.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    allowsEditing: true,
    quality: 0.8,
  });

  const asset = result.canceled ? null : result.assets[0];
  if (!asset?.base64) return null;

  const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
  const path = `${userId}/${prefix}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, decode(asset.base64), {
    contentType: asset.mimeType ?? 'image/jpeg',
    upsert: true,
  });

  if (error) {
    Alert.alert('Upload failed', error.message);
    return null;
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

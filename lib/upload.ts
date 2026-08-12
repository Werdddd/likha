import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { supabase } from './supabase/client';

async function uploadAsset(
  bucket: string,
  userId: string,
  prefix: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string | null> {
  if (!asset.base64) return null;

  const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
  const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

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
  if (!asset) return null;

  return uploadAsset(bucket, userId, prefix, asset);
}

/**
 * Opens the image library with multiple selection enabled, uploads every selected image, and
 * returns the public URLs of the ones that succeeded. Returns an empty array if the user cancels,
 * denies gallery permission, or every upload fails.
 */
export async function pickAndUploadImages(
  bucket: string,
  userId: string,
  prefix: string,
  selectionLimit = 10,
): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload images.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 0.8,
  });

  if (result.canceled || result.assets.length === 0) return [];

  const urls = await Promise.all(result.assets.map((asset) => uploadAsset(bucket, userId, prefix, asset)));
  return urls.filter((url): url is string => url !== null);
}

/**
 * Opens the system file picker (any file type), uploads the selected file to a **private**
 * bucket, and returns its storage path plus original filename. Returns null if the user cancels
 * or the upload fails. Unlike the image helpers, this never returns a public URL — the bucket is
 * meant to stay private (e.g. digital product files), gated by RLS to the owner.
 */
export async function pickAndUploadDocument(
  bucket: string,
  userId: string,
  prefix: string,
): Promise<{ path: string; fileName: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const extension = asset.name.includes('.') ? asset.name.split('.').pop() : 'bin';
  const path = `${userId}/${prefix}-${Date.now()}.${extension}`;
  const contentType = asset.mimeType ?? 'application/octet-stream';

  const uploadBody = asset.file
    ? asset.file
    : decode(await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }));

  const { error } = await supabase.storage.from(bucket).upload(path, uploadBody, {
    contentType,
    upsert: true,
  });

  if (error) {
    Alert.alert('Upload failed', error.message);
    return null;
  }

  return { path, fileName: asset.name };
}

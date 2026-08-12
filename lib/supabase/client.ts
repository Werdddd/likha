import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store caps individual values at ~2048 bytes, but a Supabase
// session (access token + refresh token + user object) regularly exceeds
// that, so values are split into chunks on write and reassembled on read.
const CHUNK_SIZE = 1800;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunkCountRaw) return SecureStore.getItemAsync(key);

    const chunkCount = Number(chunkCountRaw);
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`)),
    );
    return chunks.every((chunk) => chunk !== null) ? chunks.join('') : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const existingChunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (existingChunkCount) {
      await Promise.all(
        Array.from({ length: Number(existingChunkCount) }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}_${i}`),
        ),
      );
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      await SecureStore.setItemAsync(key, value);
      return;
    }

    await SecureStore.deleteItemAsync(key);
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
    await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)),
      ),
    );
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));
  },
  removeItem: async (key: string): Promise<void> => {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCountRaw) {
      await Promise.all(
        Array.from({ length: Number(chunkCountRaw) }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}_${i}`),
        ),
      );
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Check your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

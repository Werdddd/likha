import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase/client';

// Every notification kind (in-app rows created by supabase/migrations/0011+0028+0033+0037) is
// fanned out to these tokens server-side by the 0038 migration's trigger, so this file only has
// to get a token registered and route a tap -- it never sends anything itself.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

export function getRegisteredPushToken(): string | null {
  return registeredToken;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F4C542',
  });
}

// Best-effort: returns null (and logs why) instead of throwing, since a user who denies the
// permission prompt, or opens the app in Expo Go (which dropped remote push support on both
// platforms from SDK 53 -- a development build is required), should never crash the app.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      console.warn('[push] permission not granted, skipping token registration');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] no EAS projectId configured, skipping token registration');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    registeredToken = token;
    return token;
  } catch (error) {
    console.warn('[push] registration failed', error);
    return null;
  }
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  await supabase.from('push_tokens').upsert({ user_id: userId, token, platform }, { onConflict: 'token' });
}

export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;
  await supabase.from('push_tokens').delete().eq('token', registeredToken);
  registeredToken = null;
}

export interface PushNotificationData {
  kind?: string;
  notificationId?: string;
  creatorId?: string;
  projectId?: string;
  jobPostId?: string;
  jobOrderId?: string;
  listingId?: string;
  orderId?: string;
  conversationId?: string;
}

const SELLER_FACING_ORDER_KINDS = new Set(['order_placed', 'order_cancelled']);

// Mirrors the tap-routing rules in app/notifications.tsx, applied to the flatter `data` payload
// a push carries (see the `data` object built in migration 0038's send_push_notification()).
export function resolveNotificationRoute(data: PushNotificationData): string | null {
  if (data.orderId) {
    return data.kind && SELLER_FACING_ORDER_KINDS.has(data.kind)
      ? `/creator-order/${data.orderId}`
      : `/order/${data.orderId}`;
  }
  if (data.conversationId) return `/message/${data.conversationId}`;
  if (data.jobOrderId) return `/job-order/${data.jobOrderId}`;
  if (data.jobPostId) return `/job-post/${data.jobPostId}`;
  if (data.projectId) return `/project/${data.projectId}`;
  if (data.listingId) return `/listing/${data.listingId}`;
  if (data.creatorId) return `/creator/${data.creatorId}`;
  return '/notifications';
}

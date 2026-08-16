import {
  InstrumentSerif_400Regular,
} from '@expo-google-fonts/instrument-serif';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, fonts } from '../constants/theme';
import {
  registerForPushNotificationsAsync,
  resolveNotificationRoute,
  savePushToken,
  type PushNotificationData,
} from '../lib/push-notifications';
import { useSessionStore } from '../store/session-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fonts.heading]: InstrumentSerif_400Regular,
    [fonts.body]: PlusJakartaSans_400Regular,
    [fonts.bodyMedium]: PlusJakartaSans_500Medium,
    [fonts.bodySemiBold]: PlusJakartaSans_600SemiBold,
    [fonts.bodyBold]: PlusJakartaSans_700Bold,
  });
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const currentUserId = useSessionStore((s) => s.currentUser.id);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Registers this device's Expo push token against the signed-in user once hydration lands
  // on an authenticated session; server-side delivery is handled entirely by the 0038 migration's
  // trigger on public.notifications, so there's nothing else to wire up here.
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(currentUserId, token);
    });
  }, [isAuthenticated, currentUserId]);

  useEffect(() => {
    const routeFromResponse = (data: PushNotificationData) => {
      const route = resolveNotificationRoute(data);
      if (route) router.push(route);
    };

    // Cold start: app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) routeFromResponse(response.notification.request.content.data as PushNotificationData);
    });

    // Warm: app was backgrounded or foregrounded when the tap happened.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromResponse(response.notification.request.content.data as PushNotificationData);
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.bodySemiBold },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="project/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="creator/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="listing/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-confirmation" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="orders" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="search" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="message/[id]" />
        <Stack.Screen name="profile-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="moderation" />
        <Stack.Screen name="creator-order/[id]" />
        <Stack.Screen name="job-post/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="job-post/[id]" />
        <Stack.Screen name="job-post/[id]/offer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="my-job-posts" />
        <Stack.Screen name="my-offers" />
        <Stack.Screen name="job-order/[id]" />
        <Stack.Screen name="shelves" />
        <Stack.Screen name="shelf/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
}

import { Stack } from 'expo-router';

import { colors } from '../../constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="log-in" />
      <Stack.Screen name="onboarding-mode" />
      <Stack.Screen name="onboarding-profile" />
    </Stack>
  );
}

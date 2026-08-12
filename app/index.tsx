import { Redirect } from 'expo-router';

import { useSessionStore } from '../store/session-store';

export default function Index() {
  const isHydrating = useSessionStore((s) => s.isHydrating);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useSessionStore((s) => s.hasCompletedOnboarding);

  if (isHydrating) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(auth)/onboarding-mode" />;
  }

  return <Redirect href="/(tabs)/discover" />;
}

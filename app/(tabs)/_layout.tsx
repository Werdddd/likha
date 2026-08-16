import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { CreateSheet } from '../../components/nav/CreateSheet';
import { FloatingTabBar } from '../../components/nav/FloatingTabBar';
import { useSessionStore } from '../../store/session-store';
import { useShelfStore } from '../../store/shelf-store';

export default function TabsLayout() {
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const fetchSavedStatus = useShelfStore((s) => s.fetchSavedStatus);

  useEffect(() => {
    if (currentUserId) fetchSavedStatus(currentUserId);
  }, [currentUserId, fetchSavedStatus]);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} onCreatePress={() => setCreateSheetVisible(true)} />}
      >
        <Tabs.Screen name="discover" options={{ title: 'Home' }} />
        <Tabs.Screen name="shop" options={{ title: 'Shop' }} />
        <Tabs.Screen name="job-posts" options={{ title: 'Jobs' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      <CreateSheet visible={createSheetVisible} onClose={() => setCreateSheetVisible(false)} />
    </>
  );
}

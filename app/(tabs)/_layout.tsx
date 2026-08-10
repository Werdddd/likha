import { Tabs } from 'expo-router';
import { useState } from 'react';

import { CreateSheet } from '../../components/nav/CreateSheet';
import { FloatingTabBar } from '../../components/nav/FloatingTabBar';

export default function TabsLayout() {
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} onCreatePress={() => setCreateSheetVisible(true)} />}
      >
        <Tabs.Screen name="discover" options={{ title: 'Home' }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
        <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      <CreateSheet visible={createSheetVisible} onClose={() => setCreateSheetVisible(false)} />
    </>
  );
}

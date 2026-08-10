import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Button, Chip } from '../../components/ui';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, spacing } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';
import type { ProfileMode } from '../../types';

export default function ProfileScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const setProfileMode = useSessionStore((s) => s.setProfileMode);
  const myProjects = getProjectsByCreator(currentUser.id);

  const toggleMode = (mode: ProfileMode) => setProfileMode(mode);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader
          creator={currentUser}
          actions={<Button label="Edit Profile" variant="secondary" onPress={() => router.push('/profile-edit')} />}
          modeToggle={
            <>
              <Chip
                label="Portfolio only"
                selected={currentUser.profileMode === 'portfolio'}
                onPress={() => toggleMode('portfolio')}
              />
              <Chip
                label="Open for work"
                selected={currentUser.profileMode === 'open_for_work'}
                onPress={() => toggleMode('open_for_work')}
              />
            </>
          }
        />

        <MasonryGrid projects={myProjects} onPressProject={(project) => router.push(`/project/${project.id}`)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    paddingBottom: spacing.xxl + spacing.xxl,
  },
});

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Button, Chip } from '../../components/ui';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';
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

        {myProjects.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No projects yet. Share your first piece of work.</Text>
            <Button label="Add a project" onPress={() => router.push('/project/new')} style={styles.emptyButton} />
          </View>
        ) : (
          <MasonryGrid projects={myProjects} onPressProject={(project) => router.push(`/project/${project.id}`)} />
        )}
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
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    alignSelf: 'center',
  },
});

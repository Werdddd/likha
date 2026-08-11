import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { AnimatedPressable, Button } from '../../components/ui';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function ProfileScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const myProjects = getProjectsByCreator(currentUser.id);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader
          creator={currentUser}
          actions={
            <View style={styles.headerActions}>
              <AnimatedPressable
                style={styles.iconButton}
                onPress={() => router.push('/profile-edit')}
                scaleTo={0.92}
              >
                <Ionicons name="pencil" size={18} color={colors.ink} />
              </AnimatedPressable>
              <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/settings')} scaleTo={0.92}>
                <Ionicons name="settings-outline" size={18} color={colors.ink} />
              </AnimatedPressable>
            </View>
          }
        />

        {myProjects.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="images-outline" size={26} color={colors.warmBrown} />
            </View>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyText}>Share your first piece of work to start building your portfolio.</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    alignSelf: 'center',
  },
});

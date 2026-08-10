import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { Button } from '../../components/ui';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function PortfolioScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const myProjects = getProjectsByCreator(currentUser.id);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Work</Text>
        <Text style={styles.subtitle}>{myProjects.length} projects</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  subtitle: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.xs,
  },
  list: {
    paddingTop: spacing.sm,
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

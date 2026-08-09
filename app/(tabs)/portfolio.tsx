import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../../components/ProjectCard';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
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

      <FlatList
        data={myProjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProjectCard project={item} onPress={() => router.push(`/project/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No projects yet. Tap + to add your first one.</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push('/project/new')}>
        <Ionicons name="add" size={28} color={colors.ink} />
      </Pressable>
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  column: {
    gap: spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
});

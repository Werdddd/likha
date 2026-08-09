import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FilterBar } from '../../components/FilterBar';
import { ProjectCard } from '../../components/ProjectCard';
import { disciplines, getCreatorById, projects } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import type { Discipline } from '../../types';

export default function DiscoverScreen() {
  const [discipline, setDiscipline] = useState<Discipline | null>(null);

  const filteredProjects = useMemo(
    () => (discipline ? projects.filter((p) => p.discipline === discipline) : projects),
    [discipline],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={18} color={colors.warmBrown} />
          <Text style={styles.searchPlaceholder}>Search projects, creators, tags...</Text>
        </Pressable>
      </View>

      <FilterBar
        options={disciplines}
        selected={discipline}
        onSelect={(value) => setDiscipline(value as Discipline | null)}
      />

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProjectCard
              project={item}
              creator={getCreatorById(item.creatorId)}
              onPress={() => router.push(`/project/${item.id}`)}
            />
          </View>
        )}
      />
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
  },
  title: {
    ...t.h1,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.softGray,
    gap: spacing.xs,
  },
  searchPlaceholder: {
    ...t.body,
    color: colors.warmBrown,
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
});

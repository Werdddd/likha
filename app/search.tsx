import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../components/ProjectCard';
import { TextField } from '../components/ui';
import { FilterBar } from '../components/FilterBar';
import { disciplines, getCreatorById, projects, regions } from '../constants/mock-data';
import { colors, spacing, type as t } from '../constants/theme';
import type { Discipline, Region } from '../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.mediums.some((m) => m.toLowerCase().includes(normalizedQuery));
      const matchesDiscipline = !discipline || project.discipline === discipline;
      const matchesRegion = !region || project.region === region;
      return matchesQuery && matchesDiscipline && matchesRegion;
    });
  }, [query, discipline, region]);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={styles.searchWrapper}>
        <TextField
          label=""
          placeholder="Search projects, tags, mediums..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <Text style={styles.filterLabel}>Discipline</Text>
      <FilterBar options={disciplines} selected={discipline} onSelect={(v) => setDiscipline(v as Discipline | null)} />

      <Text style={styles.filterLabel}>Region</Text>
      <FilterBar options={regions} selected={region} onSelect={(v) => setRegion(v as Region | null)} />

      <FlatList
        data={results}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No results. Try a different search or filter.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterLabel: {
    ...t.label,
    color: colors.ink,
    marginLeft: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
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
});

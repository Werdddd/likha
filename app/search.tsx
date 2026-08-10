import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatorCard } from '../components/CreatorCard';
import { FilterBar } from '../components/FilterBar';
import { MasonryGrid } from '../components/MasonryGrid';
import { TextField } from '../components/ui';
import { creators, disciplines, getCreatorById, projects, regions } from '../constants/mock-data';
import { colors, spacing, type as t } from '../constants/theme';
import type { Discipline, Region } from '../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    return projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.mediums.some((m) => m.toLowerCase().includes(normalizedQuery));
      const matchesDiscipline = !discipline || project.discipline === discipline;
      const matchesRegion = !region || project.region === region;
      return matchesQuery && matchesDiscipline && matchesRegion;
    });
  }, [normalizedQuery, discipline, region]);

  const matchedCreators = useMemo(() => {
    if (normalizedQuery.length === 0) return [];
    return creators.filter(
      (creator) =>
        (creator.name.toLowerCase().includes(normalizedQuery) ||
          creator.handle.toLowerCase().includes(normalizedQuery)) &&
        (!discipline || creator.disciplines.includes(discipline)) &&
        (!region || creator.region === region),
    );
  }, [normalizedQuery, discipline, region]);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={styles.searchWrapper}>
        <TextField
          label=""
          placeholder="Search projects, creators, tags..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <Text style={styles.filterLabel}>Discipline</Text>
      <FilterBar options={disciplines} selected={discipline} onSelect={(v) => setDiscipline(v as Discipline | null)} />

      <Text style={styles.filterLabel}>Region</Text>
      <FilterBar options={regions} selected={region} onSelect={(v) => setRegion(v as Region | null)} />

      <ScrollView contentContainerStyle={styles.list}>
        {matchedCreators.length > 0 && (
          <View style={styles.creatorsSection}>
            <Text style={styles.sectionTitle}>Creators</Text>
            {matchedCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} onPress={() => router.push(`/creator/${creator.id}`)} />
            ))}
          </View>
        )}

        <MasonryGrid
          projects={results}
          getCreator={getCreatorById}
          onPressProject={(project) => router.push(`/project/${project.id}`)}
          emptyLabel="No results. Try a different search or filter."
        />
      </ScrollView>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  creatorsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...t.h3,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
});

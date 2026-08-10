import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '../components/CategoryRow';
import { CreatorCard } from '../components/CreatorCard';
import { MasonryGrid } from '../components/MasonryGrid';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { AnimatedPressable, TextField } from '../components/ui';
import { creators, disciplines, getCreatorById, projects, regions } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import type { Discipline, Project, Region } from '../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters = discipline !== null || region !== null;
  const isBrowsing = normalizedQuery.length === 0 && !hasActiveFilters;

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

  const categories = useMemo(() => {
    return disciplines
      .map((d) => ({ discipline: d, projects: projects.filter((p) => p.discipline === d) }))
      .filter((c) => c.projects.length > 0);
  }, []);

  const goToProject = (project: Project) => router.push(`/project/${project.id}`);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Search' }} />

      <View style={styles.searchRow}>
        <TextField
          label=""
          placeholder="Search projects, creators, tags..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          containerStyle={styles.searchField}
        />
        <AnimatedPressable style={styles.filterButton} onPress={() => setFiltersOpen(true)} scaleTo={0.92}>
          <Ionicons name="options-outline" size={20} color={colors.ink} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </AnimatedPressable>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFilters}>
          {discipline && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipLabel}>{discipline}</Text>
            </View>
          )}
          {region && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipLabel}>{region}</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.list}>
        {isBrowsing ? (
          categories.map((category) => (
            <CategoryRow
              key={category.discipline}
              title={category.discipline}
              projects={category.projects}
              onPressProject={goToProject}
              onSeeAll={() => setDiscipline(category.discipline)}
            />
          ))
        ) : (
          <>
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
              onPressProject={goToProject}
              emptyLabel="No results. Try a different search or filter."
            />
          </>
        )}
      </ScrollView>

      <SearchFilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        disciplines={disciplines}
        discipline={discipline}
        onSelectDiscipline={(v) => setDiscipline(v as Discipline | null)}
        regions={regions}
        region={region}
        onSelectRegion={(v) => setRegion(v as Region | null)}
        resultCount={results.length}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGray + '4d',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  activeChip: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  activeChipLabel: {
    ...t.caption,
    color: colors.canvas,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  scrollArea: {
    flex: 1,
  },
  list: {
    paddingTop: spacing.md,
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

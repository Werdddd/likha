import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '../components/CategoryRow';
import { CreatorCard } from '../components/CreatorCard';
import { JobPostCard } from '../components/JobPostCard';
import { MasonryGrid } from '../components/MasonryGrid';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { AnimatedPressable, TextField } from '../components/ui';
import { categories, regions } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { useCreatorStore } from '../store/creator-store';
import { useJobPostStore } from '../store/job-post-store';
import { useProjectStore } from '../store/project-store';
import type { Category, Creator, Project, Region } from '../types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [matchedCreators, setMatchedCreators] = useState<Creator[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const projectsById = useProjectStore((s) => s.projectsById);
  const fetchFeed = useProjectStore((s) => s.fetchFeed);
  const searchCreators = useCreatorStore((s) => s.searchCreators);
  const getCreator = useCreatorStore((s) => s.getCreator);
  const jobPostsById = useJobPostStore((s) => s.jobPostsById);
  const fetchJobPostFeed = useJobPostStore((s) => s.fetchFeed);

  useEffect(() => {
    fetchFeed();
    fetchJobPostFeed();
  }, [fetchFeed, fetchJobPostFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(), fetchJobPostFeed()]);
    setRefreshing(false);
  }, [fetchFeed, fetchJobPostFeed]);

  const projects = useMemo(() => Object.values(projectsById), [projectsById]);

  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters = category !== null || region !== null;
  const isBrowsing = normalizedQuery.length === 0 && !hasActiveFilters;

  const results = useMemo(() => {
    return projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.mediums.some((m) => m.toLowerCase().includes(normalizedQuery));
      const matchesCategory = !category || project.categories.includes(category);
      const matchesRegion = !region || project.region === region;
      return matchesQuery && matchesCategory && matchesRegion;
    });
  }, [normalizedQuery, category, region, projects]);

  useEffect(() => {
    if (normalizedQuery.length === 0) {
      setMatchedCreators([]);
      return;
    }
    let cancelled = false;
    searchCreators(normalizedQuery, { category, region }).then((results) => {
      if (!cancelled) setMatchedCreators(results);
    });
    return () => {
      cancelled = true;
    };
  }, [normalizedQuery, category, region, searchCreators]);

  const matchedJobPosts = useMemo(() => {
    return Object.values(jobPostsById)
      .filter((jp) => {
        if (jp.status !== 'open') return false;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          jp.title.toLowerCase().includes(normalizedQuery) ||
          jp.description.toLowerCase().includes(normalizedQuery);
        const matchesCategory = !category || jp.category === category;
        const matchesRegion = !region || jp.region === region;
        return matchesQuery && matchesCategory && matchesRegion;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [jobPostsById, normalizedQuery, category, region]);

  const categoryGroups = useMemo(() => {
    return categories
      .map((c) => ({ category: c, projects: projects.filter((p) => p.categories.includes(c)) }))
      .filter((c) => c.projects.length > 0);
  }, [projects]);

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
          {category && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipLabel}>{category}</Text>
            </View>
          )}
          {region && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipLabel}>{region}</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {isBrowsing ? (
          categoryGroups.map((group) => (
            <CategoryRow
              key={group.category}
              title={group.category}
              projects={group.projects}
              onPressProject={goToProject}
              onSeeAll={() => setCategory(group.category)}
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

            {matchedJobPosts.length > 0 && (
              <View style={styles.creatorsSection}>
                <Text style={styles.sectionTitle}>Job Posts</Text>
                {matchedJobPosts.map((jobPost) => (
                  <JobPostCard key={jobPost.id} jobPost={jobPost} onPress={() => router.push(`/job-post/${jobPost.id}`)} />
                ))}
              </View>
            )}

            <MasonryGrid
              projects={results}
              getCreator={getCreator}
              onPressProject={goToProject}
              emptyLabel="No results. Try a different search or filter."
            />
          </>
        )}
      </ScrollView>

      <SearchFilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={categories}
        category={category}
        onSelectCategory={(v) => setCategory(v as Category | null)}
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

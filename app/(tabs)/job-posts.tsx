import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { JobFilterSheet } from '../../components/JobFilterSheet';
import { JobPostCard } from '../../components/JobPostCard';
import { AnimatedPressable } from '../../components/ui';
import { categories, regions } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useJobPostStore } from '../../store/job-post-store';
import type { Category, Region } from '../../types';

export default function JobPostsScreen() {
  const [category, setCategory] = useState<Category | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [maxBudget, setMaxBudget] = useState('');
  const [deadlineBefore, setDeadlineBefore] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const jobPostsById = useJobPostStore((s) => s.jobPostsById);
  const isLoadingFeed = useJobPostStore((s) => s.isLoadingFeed);
  const fetchFeed = useJobPostStore((s) => s.fetchFeed);

  const maxBudgetValue = maxBudget.trim().length > 0 ? Number(maxBudget) : undefined;
  const deadlineBeforeValue = deadlineBefore.trim().length > 0 ? deadlineBefore.trim() : undefined;
  const hasMoreFilters = region !== null || maxBudgetValue !== undefined || deadlineBeforeValue !== undefined;

  useEffect(() => {
    fetchFeed({
      category: category ?? undefined,
      region: region ?? undefined,
      maxBudget: maxBudgetValue,
      deadlineBefore: deadlineBeforeValue,
    });
  }, [fetchFeed, category, region, maxBudgetValue, deadlineBeforeValue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed({
      category: category ?? undefined,
      region: region ?? undefined,
      maxBudget: maxBudgetValue,
      deadlineBefore: deadlineBeforeValue,
    });
    setRefreshing(false);
  }, [fetchFeed, category, region, maxBudgetValue, deadlineBeforeValue]);

  const jobPosts = useMemo(
    () =>
      Object.values(jobPostsById)
        .filter((jp) => {
          if (jp.status !== 'open') return false;
          if (category && jp.category !== category) return false;
          if (region && jp.region !== region) return false;
          if (maxBudgetValue !== undefined && !(jp.budgetMin !== null && jp.budgetMin <= maxBudgetValue)) return false;
          if (deadlineBeforeValue && !(jp.deadline !== null && jp.deadline <= deadlineBeforeValue)) return false;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobPostsById, category, region, maxBudgetValue, deadlineBeforeValue],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <View style={styles.headerActions}>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/my-offers')} scaleTo={0.92}>
            <Ionicons name="paper-plane-outline" size={19} color={colors.ink} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/my-job-posts')} scaleTo={0.92}>
            <Ionicons name="briefcase-outline" size={19} color={colors.ink} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/job-post/new')} scaleTo={0.92}>
            <Ionicons name="add" size={22} color={colors.ink} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.filterBar}>
        <FilterBar options={categories} selected={category} onSelect={(v) => setCategory(v as Category | null)} />
        <AnimatedPressable style={styles.moreFiltersButton} onPress={() => setFiltersOpen(true)} scaleTo={0.92}>
          <Ionicons name="options-outline" size={18} color={colors.ink} />
          {hasMoreFilters && <View style={styles.filterDot} />}
        </AnimatedPressable>
      </View>

      {isLoadingFeed && jobPosts.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : jobPosts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="briefcase-outline" size={32} color={colors.warmBrown} />
          </View>
          <Text style={styles.emptyTitle}>No open job posts</Text>
          <Text style={styles.emptyBody}>Be the first to post a need — creators will start sending offers.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          {jobPosts.map((jobPost) => (
            <JobPostCard key={jobPost.id} jobPost={jobPost} onPress={() => router.push(`/job-post/${jobPost.id}`)} />
          ))}
        </ScrollView>
      )}

      <JobFilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        regions={regions}
        region={region}
        onSelectRegion={(v) => setRegion(v as Region | null)}
        maxBudget={maxBudget}
        onChangeMaxBudget={setMaxBudget}
        deadlineBefore={deadlineBefore}
        onChangeDeadlineBefore={setDeadlineBefore}
        resultCount={jobPosts.length}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  moreFiltersButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginRight: spacing.md,
    ...shadow.sm,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.terracotta,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
});

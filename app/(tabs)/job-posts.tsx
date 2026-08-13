import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { JobPostCard } from '../../components/JobPostCard';
import { AnimatedPressable } from '../../components/ui';
import { categories } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';
import { useJobPostStore } from '../../store/job-post-store';
import type { Category } from '../../types';

export default function JobPostsScreen() {
  const [category, setCategory] = useState<Category | null>(null);
  const jobPostsById = useJobPostStore((s) => s.jobPostsById);
  const isLoadingFeed = useJobPostStore((s) => s.isLoadingFeed);
  const fetchFeed = useJobPostStore((s) => s.fetchFeed);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const jobPosts = useMemo(
    () =>
      Object.values(jobPostsById)
        .filter((jp) => jp.status === 'open' && (!category || jp.category === category))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobPostsById, category],
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
      </View>

      {isLoadingFeed && jobPosts.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : jobPosts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No open job posts</Text>
          <Text style={styles.emptyBody}>Be the first to post a need — creators will start sending offers.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {jobPosts.map((jobPost) => (
            <JobPostCard key={jobPost.id} jobPost={jobPost} onPress={() => router.push(`/job-post/${jobPost.id}`)} />
          ))}
        </ScrollView>
      )}
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
  },
  filterBar: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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

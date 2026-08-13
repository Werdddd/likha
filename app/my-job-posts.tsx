import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useJobPostStore } from '../store/job-post-store';
import { useSessionStore } from '../store/session-store';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export default function MyJobPostsScreen() {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const jobPostsById = useJobPostStore((s) => s.jobPostsById);
  const fetchMyJobPosts = useJobPostStore((s) => s.fetchMyJobPosts);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUserId) fetchMyJobPosts(currentUserId);
  }, [currentUserId, fetchMyJobPosts]);

  const onRefresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    await fetchMyJobPosts(currentUserId);
    setRefreshing(false);
  }, [currentUserId, fetchMyJobPosts]);

  const myJobPosts = Object.values(jobPostsById)
    .filter((jp) => jp.buyerId === currentUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (myJobPosts.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'My Job Posts' }} />
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <Ionicons name="briefcase-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No job posts yet</Text>
          <Text style={styles.emptyBody}>Post a need and creators will start sending offers.</Text>
          <Button label="Post a Job" onPress={() => router.push('/job-post/new')} style={styles.emptyButton} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'My Job Posts' }} />
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {myJobPosts.map((jobPost) => (
          <AnimatedPressable
            key={jobPost.id}
            style={styles.card}
            onPress={() => router.push(`/job-post/${jobPost.id}`)}
            scaleTo={0.98}
          >
            <View style={styles.cardTop}>
              <Text style={styles.postDate}>{new Date(jobPost.createdAt).toLocaleDateString()}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusLabel}>{STATUS_LABELS[jobPost.status]}</Text>
              </View>
            </View>
            <Text style={styles.postTitle} numberOfLines={1}>
              {jobPost.title}
            </Text>
            <Text style={styles.postMeta}>
              {jobPost.offerCount} offer{jobPost.offerCount === 1 ? '' : 's'} · {jobPost.category}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    ...t.label,
    color: colors.ink,
  },
  statusBadge: {
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  postTitle: {
    ...t.bodyMedium,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  postMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
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
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Badge, type BadgeTone, Button, Card } from '../components/ui';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { useJobPostStore } from '../store/job-post-store';
import { useSessionStore } from '../store/session-store';
import type { JobPost } from '../types';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  open: 'active',
  fulfilled: 'positive',
  cancelled: 'muted',
};

export default function MyJobPostsScreen() {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const jobPostsById = useJobPostStore((s) => s.jobPostsById);
  const fetchMyJobPosts = useJobPostStore((s) => s.fetchMyJobPosts);
  const cancelJobPost = useJobPostStore((s) => s.cancelJobPost);
  const deleteJobPost = useJobPostStore((s) => s.deleteJobPost);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCancel = (jobPost: JobPost) => {
    Alert.alert(
      'Cancel this job post?',
      'Creators will no longer be able to submit offers.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Post',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(jobPost.id);
            const { error } = await cancelJobPost(jobPost.id);
            setCancellingId(null);
            if (error) Alert.alert('Could not cancel this job post', error);
          },
        },
      ],
    );
  };

  const handleDelete = (jobPost: JobPost) => {
    Alert.alert(
      'Delete this job post?',
      'This permanently removes it from your job posts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(jobPost.id);
            const { error } = await deleteJobPost(jobPost.id);
            setDeletingId(null);
            if (error) Alert.alert('Could not delete this job post', error);
          },
        },
      ],
    );
  };

  if (myJobPosts.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'My Job Posts' }} />
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="briefcase-outline" size={32} color={colors.warmBrown} />
          </View>
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
          <Card key={jobPost.id} style={styles.card}>
            <AnimatedPressable onPress={() => router.push(`/job-post/${jobPost.id}`)} scaleTo={0.98}>
              <View style={styles.cardTop}>
                <Text style={styles.postDate}>{new Date(jobPost.createdAt).toLocaleDateString()}</Text>
                <Badge label={STATUS_LABELS[jobPost.status]} tone={STATUS_TONES[jobPost.status]} />
              </View>
              <Text style={styles.postTitle} numberOfLines={1}>
                {jobPost.title}
              </Text>
              <Text style={styles.postMeta}>
                {jobPost.offerCount} offer{jobPost.offerCount === 1 ? '' : 's'} · {jobPost.category}
              </Text>
            </AnimatedPressable>
            {jobPost.status === 'open' && (
              <View style={styles.actionRow}>
                <Button
                  label="Edit"
                  variant="secondary"
                  onPress={() => router.push(`/job-post/${jobPost.id}/edit`)}
                  style={styles.actionButton}
                />
                <Button
                  label={cancellingId === jobPost.id ? 'Cancelling…' : 'Cancel Job Post'}
                  variant="ghost"
                  onPress={() => handleCancel(jobPost)}
                  disabled={cancellingId === jobPost.id}
                  style={styles.actionButton}
                />
              </View>
            )}
            {jobPost.status === 'cancelled' && (
              <Button
                label={deletingId === jobPost.id ? 'Deleting…' : 'Delete'}
                variant="ghost"
                onPress={() => handleDelete(jobPost)}
                disabled={deletingId === jobPost.id}
                style={styles.cancelButton}
              />
            )}
          </Card>
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
    marginBottom: spacing.sm,
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
  cancelButton: {
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
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
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

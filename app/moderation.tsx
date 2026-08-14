import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useCreatorStore } from '../store/creator-store';
import { useListingStore } from '../store/listing-store';
import { useProjectStore } from '../store/project-store';
import { useSessionStore } from '../store/session-store';
import type { Listing, Project } from '../types';

type PendingItem =
  | { kind: 'project'; id: string; createdAt: string; project: Project }
  | { kind: 'listing'; id: string; createdAt: string; listing: Listing };

export default function ModerationScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const isAdmin = currentUser.role === 'admin';

  const fetchPendingReview = useProjectStore((s) => s.fetchPendingReview);
  const moderateProject = useProjectStore((s) => s.moderateProject);
  const fetchPendingListings = useListingStore((s) => s.fetchPendingListings);
  const moderateListing = useListingStore((s) => s.moderateListing);
  const getCreator = useCreatorStore((s) => s.getCreator);

  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [projects, listings] = await Promise.all([fetchPendingReview(), fetchPendingListings()]);
    setPendingProjects(projects);
    setPendingListings(listings);
  }, [fetchPendingReview, fetchPendingListings]);

  useEffect(() => {
    if (!isAdmin) return;
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [isAdmin, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const items: PendingItem[] = useMemo(() => {
    const projectItems: PendingItem[] = pendingProjects.map((project) => ({
      kind: 'project',
      id: project.id,
      createdAt: project.createdAt,
      project,
    }));
    const listingItems: PendingItem[] = pendingListings.map((listing) => ({
      kind: 'listing',
      id: listing.id,
      createdAt: listing.createdAt,
      listing,
    }));
    return [...projectItems, ...listingItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [pendingProjects, pendingListings]);

  const handleDecision = async (item: PendingItem, decision: 'approved' | 'rejected') => {
    setDecidingId(item.id);
    const { error } =
      item.kind === 'project' ? await moderateProject(item.id, decision) : await moderateListing(item.id, decision);
    setDecidingId(null);
    if (error) {
      Alert.alert('Could not update', error);
      return;
    }
    if (item.kind === 'project') {
      setPendingProjects((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      setPendingListings((prev) => prev.filter((l) => l.id !== item.id));
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Moderation Queue' }} />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>Not authorized</Text>
          <Text style={styles.emptyBody}>Only admins can access the moderation queue.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Moderation Queue' }} />

      {isLoading && items.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>Nothing pending</Text>
          <Text style={styles.emptyBody}>Flagged projects and listings will show up here for review.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          {items.map((item) => {
            const title = item.kind === 'project' ? item.project.title : item.listing.title;
            const coverUrl = item.kind === 'project' ? item.project.coverUrl : item.listing.coverUrl;
            const creatorId = item.kind === 'project' ? item.project.creatorId : item.listing.creatorId;
            const reason = item.kind === 'project' ? item.project.moderationReason : item.listing.moderationReason;
            const creator = getCreator(creatorId);
            const isDeciding = decidingId === item.id;

            return (
              <View key={`${item.kind}-${item.id}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: coverUrl }} style={styles.thumb} contentFit="cover" />
                  <View style={styles.cardInfo}>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeTagLabel}>{item.kind === 'project' ? 'Project' : 'Listing'}</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.cardCreator} numberOfLines={1}>
                      {creator ? `@${creator.handle}` : 'Unknown creator'}
                    </Text>
                  </View>
                </View>

                {reason && (
                  <View style={styles.reasonBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.warmBrown} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    label="Reject"
                    variant="ghost"
                    disabled={isDeciding}
                    onPress={() => handleDecision(item, 'rejected')}
                    style={styles.actionButton}
                  />
                  <Button
                    label={isDeciding ? 'Working…' : 'Approve'}
                    variant="secondary"
                    disabled={isDeciding}
                    onPress={() => handleDecision(item, 'approved')}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            );
          })}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 2,
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  typeTagLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  cardTitle: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  cardCreator: {
    ...t.caption,
    color: colors.warmBrown,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.likhaYellow + '33',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  reasonText: {
    ...t.caption,
    color: colors.warmBrown,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

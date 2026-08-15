import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModerationNoteSheet } from '../components/ModerationNoteSheet';
import { AnimatedPressable, Button } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useCreatorStore } from '../store/creator-store';
import { useListingStore } from '../store/listing-store';
import { useProjectStore } from '../store/project-store';
import { useSessionStore } from '../store/session-store';
import type { Listing, Project } from '../types';

type HiddenItem =
  | { kind: 'project'; id: string; createdAt: string; project: Project }
  | { kind: 'listing'; id: string; createdAt: string; listing: Listing };

export default function ModerationScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const isAdmin = currentUser.role === 'admin';

  const fetchHidden = useProjectStore((s) => s.fetchHidden);
  const moderateProject = useProjectStore((s) => s.moderateProject);
  const adminDeleteProject = useProjectStore((s) => s.adminDeleteProject);
  const fetchHiddenListings = useListingStore((s) => s.fetchHiddenListings);
  const moderateListing = useListingStore((s) => s.moderateListing);
  const adminDeleteListing = useListingStore((s) => s.adminDeleteListing);
  const getCreator = useCreatorStore((s) => s.getCreator);

  const [hiddenProjects, setHiddenProjects] = useState<Project[]>([]);
  const [hiddenListings, setHiddenListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<HiddenItem | null>(null);

  const load = useCallback(async () => {
    const [projects, listings] = await Promise.all([fetchHidden(), fetchHiddenListings()]);
    setHiddenProjects(projects);
    setHiddenListings(listings);
  }, [fetchHidden, fetchHiddenListings]);

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

  const items: HiddenItem[] = useMemo(() => {
    const projectItems: HiddenItem[] = hiddenProjects.map((project) => ({
      kind: 'project',
      id: project.id,
      createdAt: project.createdAt,
      project,
    }));
    const listingItems: HiddenItem[] = hiddenListings.map((listing) => ({
      kind: 'listing',
      id: listing.id,
      createdAt: listing.createdAt,
      listing,
    }));
    return [...projectItems, ...listingItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [hiddenProjects, hiddenListings]);

  const handleRestore = async (item: HiddenItem) => {
    setWorkingId(item.id);
    const { error } =
      item.kind === 'project' ? await moderateProject(item.id, 'restore') : await moderateListing(item.id, 'restore');
    setWorkingId(null);
    if (error) {
      Alert.alert('Could not restore', error);
      return;
    }
    if (item.kind === 'project') setHiddenProjects((prev) => prev.filter((p) => p.id !== item.id));
    else setHiddenListings((prev) => prev.filter((l) => l.id !== item.id));
  };

  const handleRemoveConfirm = async (note: string) => {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    setWorkingId(target.id);
    const { error } =
      target.kind === 'project' ? await adminDeleteProject(target.id, note) : await adminDeleteListing(target.id, note);
    setWorkingId(null);
    if (error) {
      Alert.alert('Could not remove', error);
      return;
    }
    if (target.kind === 'project') setHiddenProjects((prev) => prev.filter((p) => p.id !== target.id));
    else setHiddenListings((prev) => prev.filter((l) => l.id !== target.id));
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Hidden Posts' }} />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>Not authorized</Text>
          <Text style={styles.emptyBody}>Only admins can access this screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Hidden Posts' }} />

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
          <Text style={styles.emptyTitle}>Nothing hidden</Text>
          <Text style={styles.emptyBody}>
            Projects and listings you hide will show up here so you can restore or permanently remove them.
          </Text>
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
            const isWorking = workingId === item.id;
            const detailHref = item.kind === 'project' ? `/project/${item.id}` : `/listing/${item.id}`;

            return (
              <View key={`${item.kind}-${item.id}`} style={styles.card}>
                <AnimatedPressable
                  style={styles.cardTop}
                  scaleTo={0.98}
                  onPress={() => router.push(detailHref as never)}
                >
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
                </AnimatedPressable>

                {reason && (
                  <View style={styles.reasonBox}>
                    <Ionicons name="chatbox-ellipses-outline" size={14} color={colors.warmBrown} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    label="Restore"
                    variant="secondary"
                    disabled={isWorking}
                    onPress={() => handleRestore(item)}
                    style={styles.actionButton}
                  />
                  <Button
                    label="Remove"
                    variant="ghost"
                    disabled={isWorking}
                    onPress={() => setRemoveTarget(item)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ModerationNoteSheet
        visible={removeTarget !== null}
        title="Remove permanently"
        body="This permanently deletes it. The creator will be notified with your reason."
        confirmLabel="Remove"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />
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
    backgroundColor: colors.terracotta + '1a',
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

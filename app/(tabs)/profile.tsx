import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BentoGrid, type BentoEntry } from '../../components/BentoGrid';
import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { AnimatedPressable, Button, SegmentedControl } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useCreatorStore } from '../../store/creator-store';
import { useListingStore } from '../../store/listing-store';
import { useProjectStore } from '../../store/project-store';
import { useSessionStore } from '../../store/session-store';
import { useShelfStore } from '../../store/shelf-store';

type ProfileTab = 'portfolio' | 'shelves';

const PROFILE_TAB_OPTIONS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'shelves', label: 'Shelves' },
];

const SHELF_PREVIEW_LIMIT = 6;

export default function ProfileScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const fetchByCreator = useProjectStore((s) => s.fetchByCreator);
  const projectsById = useProjectStore((s) => s.projectsById);
  const listingsById = useListingStore((s) => s.listingsById);
  const getCreator = useCreatorStore((s) => s.getCreator);

  const shelvesById = useShelfStore((s) => s.shelvesById);
  const itemOrderByShelf = useShelfStore((s) => s.itemOrderByShelf);
  const fetchMyShelves = useShelfStore((s) => s.fetchMyShelves);
  const fetchShelfItems = useShelfStore((s) => s.fetchShelfItems);

  const [profileTab, setProfileTab] = useState<ProfileTab>('portfolio');
  const [refreshing, setRefreshing] = useState(false);

  const myProjects = useMemo(
    () =>
      Object.values(projectsById)
        .filter((p) => p.creatorId === currentUser.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [projectsById, currentUser.id],
  );

  const myShelves = useMemo(
    () =>
      Object.values(shelvesById)
        .filter((shelf) => shelf.ownerId === currentUser.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [shelvesById, currentUser.id],
  );

  const loadShelves = useCallback(async () => {
    if (!currentUser.id) return;
    const shelves = await fetchMyShelves(currentUser.id);
    await Promise.all(shelves.map((shelf) => fetchShelfItems(shelf.id)));
  }, [currentUser.id, fetchMyShelves, fetchShelfItems]);

  useEffect(() => {
    if (currentUser.id) fetchByCreator(currentUser.id);
  }, [currentUser.id, fetchByCreator]);

  useEffect(() => {
    loadShelves();
  }, [loadShelves]);

  const onRefresh = useCallback(async () => {
    if (!currentUser.id) return;
    setRefreshing(true);
    await Promise.all([fetchByCreator(currentUser.id), loadShelves()]);
    setRefreshing(false);
  }, [currentUser.id, fetchByCreator, loadShelves]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <ProfileHeader
          creator={currentUser}
          actions={
            <View style={styles.headerActions}>
              <AnimatedPressable
                style={styles.iconButton}
                onPress={() => router.push('/profile-edit')}
                scaleTo={0.92}
              >
                <Ionicons name="pencil" size={18} color={colors.ink} />
              </AnimatedPressable>
              <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/shelves')} scaleTo={0.92}>
                <Ionicons name="library-outline" size={18} color={colors.ink} />
              </AnimatedPressable>
              <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/settings')} scaleTo={0.92}>
                <Ionicons name="settings-outline" size={18} color={colors.ink} />
              </AnimatedPressable>
            </View>
          }
        />

        <View style={styles.tabRow}>
          <SegmentedControl options={PROFILE_TAB_OPTIONS} value={profileTab} onChange={setProfileTab} />
        </View>

        {profileTab === 'portfolio' ? (
          myProjects.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="images-outline" size={26} color={colors.warmBrown} />
              </View>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>Share your first piece of work to start building your portfolio.</Text>
              <Button label="Add a project" onPress={() => router.push('/project/new')} style={styles.emptyButton} />
            </View>
          ) : (
            <MasonryGrid projects={myProjects} onPressProject={(project) => router.push(`/project/${project.id}`)} />
          )
        ) : myShelves.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bookmark-outline" size={26} color={colors.warmBrown} />
            </View>
            <Text style={styles.emptyTitle}>No shelves yet</Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on any listing or project to save it to a shelf.
            </Text>
          </View>
        ) : (
          <View style={styles.shelvesWrap}>
            {myShelves.map((shelf) => {
              const order = itemOrderByShelf[shelf.id] ?? [];
              const preview = order.slice(0, SHELF_PREVIEW_LIMIT);
              const entries: BentoEntry[] = preview.reduce<BentoEntry[]>((acc, item) => {
                if (item.type === 'listing') {
                  const listing = listingsById[item.id];
                  if (listing) acc.push({ type: 'listing', listing });
                } else {
                  const project = projectsById[item.id];
                  if (project) acc.push({ type: 'project', project });
                }
                return acc;
              }, []);

              return (
                <View key={shelf.id} style={styles.shelfSection}>
                  <AnimatedPressable
                    style={styles.shelfHeader}
                    onPress={() => router.push(`/shelf/${shelf.id}`)}
                    scaleTo={0.98}
                  >
                    <View style={styles.shelfHeaderText}>
                      <Text style={styles.shelfName}>{shelf.name}</Text>
                      <Text style={styles.shelfMeta}>
                        {shelf.itemCount} item{shelf.itemCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.warmBrown} />
                  </AnimatedPressable>

                  {entries.length === 0 ? (
                    <Text style={styles.shelfEmptyText}>Nothing saved here yet.</Text>
                  ) : (
                    <BentoGrid
                      items={entries}
                      getCreator={getCreator}
                      onPressListing={(listing) => router.push(`/listing/${listing.id}`)}
                      onPressProject={(project) => router.push(`/project/${project.id}`)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    paddingBottom: spacing.xxl + spacing.xxl,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  tabRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  shelvesWrap: {
    gap: spacing.lg,
  },
  shelfSection: {
    gap: spacing.sm,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  shelfHeaderText: {
    flex: 1,
  },
  shelfName: {
    ...t.h3,
    color: colors.ink,
  },
  shelfMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 1,
  },
  shelfEmptyText: {
    ...t.caption,
    color: colors.warmBrown,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    alignSelf: 'center',
  },
});

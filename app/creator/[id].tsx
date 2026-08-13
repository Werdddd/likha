import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingGrid } from '../../components/ListingGrid';
import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { AnimatedPressable, Button, SegmentedControl } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useCreatorStore } from '../../store/creator-store';
import { useListingStore } from '../../store/listing-store';
import { useMessageStore } from '../../store/message-store';
import { useProjectStore } from '../../store/project-store';
import { useSessionStore } from '../../store/session-store';

type ProfileTab = 'portfolio' | 'shop';

const PROFILE_TAB_OPTIONS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'shop', label: 'Shop' },
];

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const creator = useCreatorStore((s) => s.getCreator(id));
  const fetchCreators = useCreatorStore((s) => s.fetchByIds);
  const checkIsFollowing = useCreatorStore((s) => s.isFollowing);
  const followCreator = useCreatorStore((s) => s.follow);
  const unfollowCreator = useCreatorStore((s) => s.unfollow);
  const fetchByCreator = useProjectStore((s) => s.fetchByCreator);
  const projectsById = useProjectStore((s) => s.projectsById);
  const creatorProjects = useMemo(
    () =>
      Object.values(projectsById)
        .filter((p) => p.creatorId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [projectsById, id],
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const insets = useSafeAreaInsets();
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);

  const isSeller = creator?.profileMode === 'open_for_work';
  const [profileTab, setProfileTab] = useState<ProfileTab>('portfolio');
  const fetchListingsByCreator = useListingStore((s) => s.fetchByCreator);
  const listingsById = useListingStore((s) => s.listingsById);
  const getCreatorForListing = useCreatorStore((s) => s.getCreator);
  const creatorListings = useMemo(
    () =>
      Object.values(listingsById)
        .filter((l) => l.creatorId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [listingsById, id],
  );

  useEffect(() => {
    if (!creator) fetchCreators([id]);
    fetchByCreator(id);
  }, [id, creator, fetchCreators, fetchByCreator]);

  useEffect(() => {
    if (isSeller) fetchListingsByCreator(id);
  }, [isSeller, id, fetchListingsByCreator]);

  useEffect(() => {
    if (!currentUserId || currentUserId === id) return;
    checkIsFollowing(currentUserId, id).then(setIsFollowing);
  }, [currentUserId, id, checkIsFollowing]);

  const handleMessage = async () => {
    const conversationId = await getOrCreateConversation(id);
    if (conversationId) router.push(`/message/${conversationId}`);
  };

  const handleToggleFollow = async () => {
    if (!currentUserId) return;
    if (isFollowing) {
      setIsFollowing(false);
      await unfollowCreator(currentUserId, id);
    } else {
      setIsFollowing(true);
      await followCreator(currentUserId, id);
    }
  };

  if (!creator) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Creator' }} />
        <Text style={styles.body}>Creator not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader
          creator={creator}
          actions={
            <View style={styles.actionButtons}>
              {creator.id !== currentUserId && (
                <>
                  <Button label="Message" onPress={handleMessage} style={styles.messageButton} />
                  <Button
                    label={isFollowing ? 'Following' : 'Follow'}
                    variant={isFollowing ? 'ghost' : 'secondary'}
                    onPress={handleToggleFollow}
                  />
                </>
              )}
            </View>
          }
        />

        {isSeller && (
          <View style={styles.tabRow}>
            <SegmentedControl options={PROFILE_TAB_OPTIONS} value={profileTab} onChange={setProfileTab} />
          </View>
        )}

        {isSeller && profileTab === 'shop' ? (
          <View style={styles.gridWrap}>
            <ListingGrid
              listings={creatorListings}
              getCreator={getCreatorForListing}
              onPressListing={(listing) => router.push(`/listing/${listing.id}`)}
              emptyLabel="No listings yet."
            />
          </View>
        ) : (
          <MasonryGrid projects={creatorProjects} onPressProject={(project) => router.push(`/project/${project.id}`)} />
        )}
      </ScrollView>

      <AnimatedPressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        scaleTo={0.9}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </AnimatedPressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tabRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  gridWrap: {
    paddingHorizontal: spacing.sm,
  },
  messageButton: {
    paddingHorizontal: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

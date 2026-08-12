import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useCreatorStore } from '../store/creator-store';
import { useSessionStore } from '../store/session-store';
import type { Creator, Project } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Avatar } from './ui/Avatar';

interface FeaturedWorksProps {
  projects: Project[];
  getCreator: (id: string) => Creator | undefined;
  onPressProject?: (project: Project) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2 - spacing.xl;
const CARD_HEIGHT = 220;
const CARD_GAP = spacing.sm;
const PHOTO_INTERVAL = 3000;

export function FeaturedWorks({ projects, getCreator, onPressProject }: FeaturedWorksProps) {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const fetchFollowingSet = useCreatorStore((s) => s.fetchFollowingSet);
  const followCreator = useCreatorStore((s) => s.follow);
  const unfollowCreator = useCreatorStore((s) => s.unfollow);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);

  const creatorIds = [...new Set(projects.map((p) => p.creatorId))].join(',');

  useEffect(() => {
    if (!currentUserId || !creatorIds) return;
    const ids = creatorIds.split(',').filter((cid) => cid !== currentUserId);
    if (ids.length === 0) return;
    fetchFollowingSet(currentUserId, ids).then(setFollowed);
  }, [currentUserId, creatorIds, fetchFollowingSet]);

  const toggleFollow = useCallback(
    async (creatorId: string) => {
      if (!currentUserId || creatorId === currentUserId) return;
      const isFollowing = followed.has(creatorId);

      setFollowed((prev) => {
        const next = new Set(prev);
        isFollowing ? next.delete(creatorId) : next.add(creatorId);
        return next;
      });

      if (isFollowing) await unfollowCreator(currentUserId, creatorId);
      else await followCreator(currentUserId, creatorId);
    },
    [currentUserId, followed, followCreator, unfollowCreator],
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
      setActiveIndex(Math.max(0, Math.min(index, projects.length - 1)));
    },
    [projects.length],
  );

  if (projects.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Featured Works</Text>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const creator = getCreator(item.creatorId);
          if (!creator) return null;
          return (
            <FeaturedCard
              project={item}
              creator={creator}
              following={followed.has(creator.id)}
              onToggleFollow={() => toggleFollow(creator.id)}
              isOwnCard={creator.id === currentUserId}
              onPress={() => onPressProject?.(item)}
              total={projects.length}
              activeIndex={activeIndex}
              showDots={index === activeIndex}
            />
          );
        }}
      />
    </View>
  );
}

function useAutoCarousel(photoCount: number, interval = PHOTO_INTERVAL) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (photoCount < 2) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % photoCount);
    }, interval);
    return () => clearInterval(id);
  }, [photoCount, interval]);

  return index;
}

interface FeaturedCardProps {
  project: Project;
  creator: Creator;
  following: boolean;
  onToggleFollow: () => void;
  isOwnCard: boolean;
  onPress?: () => void;
  total: number;
  activeIndex: number;
  showDots: boolean;
}

function FeaturedCard({
  project,
  creator,
  following,
  onToggleFollow,
  isOwnCard,
  onPress,
  total,
  activeIndex,
  showDots,
}: FeaturedCardProps) {
  const photos = project.media.length > 0 ? project.media.map((m) => m.url) : [project.coverUrl];
  const photoIndex = useAutoCarousel(photos.length);

  return (
    <AnimatedPressable style={styles.card} onPress={onPress} scaleTo={0.98}>
      <Image
        source={{ uri: photos[photoIndex] }}
        style={styles.cardImage}
        contentFit="cover"
        transition={450}
      />
      <View style={styles.cardTop}>
        <View style={styles.creatorInfo}>
          <Avatar uri={creator.avatarUrl} size={32} bordered />
          <View style={styles.creatorText}>
            <Text style={styles.creatorName} numberOfLines={1}>
              {creator.handle}
            </Text>
            <Text style={styles.creatorRole} numberOfLines={1}>
              {project.categories.join(' · ')}
            </Text>
          </View>
        </View>

        {!isOwnCard && (
          <AnimatedPressable style={styles.followButton} onPress={onToggleFollow} scaleTo={0.92}>
            <Text style={styles.followButtonLabel}>{following ? 'Following' : 'Follow'}</Text>
          </AnimatedPressable>
        )}
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.titleLabel} numberOfLines={2}>
          {project.title}
        </Text>

        {showDots && total > 1 && (
          <View style={styles.dotsPill}>
            {Array.from({ length: total }).map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  title: {
    ...t.h3,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.softGray,
    marginRight: CARD_GAP,
    ...shadow.md,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
  },
  creatorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  creatorText: {
    marginLeft: spacing.xs + 2,
    flex: 1,
  },
  creatorName: {
    ...t.label,
    color: colors.white,
    ...textShadow,
  },
  creatorRole: {
    ...t.caption,
    color: colors.white,
    opacity: 0.85,
    marginTop: 1,
    ...textShadow,
  },
  followButton: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
  },
  followButtonLabel: {
    ...t.label,
    fontSize: 12,
    color: colors.ink,
  },
  cardBottom: {
    position: 'absolute',
    left: spacing.sm + 2,
    right: spacing.sm + 2,
    bottom: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleLabel: {
    ...t.bodyMedium,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.white,
    flexShrink: 1,
    ...textShadow,
  },
  dotsPill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.likhaYellow,
  },
});

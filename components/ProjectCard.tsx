import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { pseudoRatioForId } from '../lib/masonry';
import type { Creator, Listing, Project } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface ProjectCardProps {
  project: Project;
  creator?: Creator;
  listing?: Listing;
  onPress?: () => void;
}

const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

export function ProjectCard({ project, creator, listing, onPress }: ProjectCardProps) {
  const ratio = pseudoRatioForId(project.id);

  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleTo={0.97}>
      <Image source={{ uri: project.coverUrl }} style={[styles.cover, { aspectRatio: ratio }]} contentFit="cover" />

      <View style={styles.topContent}>
        {creator && (
          <View style={styles.creatorRow}>
            <Avatar uri={creator.avatarUrl} size={22} bordered />
            <Text style={styles.creatorName} numberOfLines={1}>
              {creator.name}
            </Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {project.title}
        </Text>
      </View>

      {/* Only ever populated for rows the viewer is allowed to see hidden (their own, or
          an admin) -- RLS never returns hidden rows to anyone else. */}
      {project.moderationStatus === 'rejected' && (
        <View style={styles.moderationBadgeWrap}>
          <Badge label="Hidden" tone="muted" />
        </View>
      )}

      <View style={styles.reactionBadge}>
        <Ionicons name="heart" size={11} color={colors.likhaYellow} />
        <Text style={styles.reactionCount}>{project.appreciations}</Text>
      </View>

      {listing && (
        <AnimatedPressable
          style={styles.shopBadge}
          scaleTo={0.92}
          onPress={() => router.push(`/listing/${listing.id}`)}
        >
          <Ionicons name="bag-outline" size={11} color={colors.ink} />
          <Text style={styles.shopBadgeLabel}>In Shop</Text>
        </AnimatedPressable>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.softGray,
    ...shadow.sm,
  },
  cover: {
    width: '100%',
    backgroundColor: colors.softGray,
  },
  topContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    gap: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  creatorName: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.white,
    ...textShadow,
  },
  title: {
    ...t.bodyMedium,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.white,
    ...textShadow,
  },
  moderationBadgeWrap: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs + 2,
    ...shadow.sm,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: spacing.xs + 2,
    right: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.white + 'E6',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    ...shadow.sm,
  },
  reactionCount: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  shopBadge: {
    position: 'absolute',
    bottom: spacing.xs + 2,
    left: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.likhaYellow + 'E6',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    ...shadow.sm,
  },
  shopBadgeLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
});

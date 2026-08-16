import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { pseudoRatioForId } from '../lib/masonry';
import { useShelfStore } from '../store/shelf-store';
import type { Creator, Listing } from '../types';
import { SaveToShelfSheet } from './SaveToShelfSheet';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface ListingCardProps {
  listing: Listing;
  creator?: Creator;
  onPress?: () => void;
}

const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

export function ListingCard({ listing, creator, onPress }: ListingCardProps) {
  const ratio = pseudoRatioForId(listing.id);
  const isSaved = useShelfStore((s) => !!s.savedListingIds[listing.id]);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);

  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleTo={0.97}>
      <Image source={{ uri: listing.coverUrl }} style={[styles.cover, { aspectRatio: ratio }]} contentFit="cover" />

      <SaveToShelfSheet visible={saveSheetVisible} onClose={() => setSaveSheetVisible(false)} listingId={listing.id} />

      <View style={styles.topRightBadges}>
        <AnimatedPressable style={styles.saveBadge} scaleTo={0.85} onPress={() => setSaveSheetVisible(true)}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={14} color={isSaved ? colors.likhaYellow : colors.white} />
        </AnimatedPressable>
        <View style={styles.typeBadge}>
          <Ionicons
            name={listing.productType === 'digital' ? 'cloud-download-outline' : 'cube-outline'}
            size={11}
            color={colors.white}
          />
          <Text style={styles.typeBadgeLabel}>{listing.productType === 'digital' ? 'Digital' : 'Physical'}</Text>
        </View>
      </View>

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
          {listing.title}
        </Text>
        {listing.ratingCount > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.likhaYellow} />
            <Text style={styles.ratingText}>
              {listing.ratingAvg.toFixed(1)} ({listing.ratingCount})
            </Text>
          </View>
        )}
      </View>

      <View style={styles.priceBadge}>
        <Text style={styles.priceLabel}>{formatPrice(listing.price)}</Text>
      </View>

      {/* Only ever populated for rows the viewer is allowed to see hidden (their own, or
          an admin) -- RLS never returns hidden rows to anyone else. */}
      {listing.moderationStatus === 'rejected' && (
        <View style={styles.moderationBadgeWrap}>
          <Badge label="Hidden" tone="muted" />
        </View>
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
  topRightBadges: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink + 'B3',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.ink + 'B3',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
  },
  typeBadgeLabel: {
    ...t.caption,
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.white,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    ...t.caption,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.white,
    ...textShadow,
  },
  moderationBadgeWrap: {
    position: 'absolute',
    bottom: spacing.xs + 2,
    left: spacing.xs + 2,
    ...shadow.sm,
  },
  priceBadge: {
    position: 'absolute',
    bottom: spacing.xs + 2,
    right: spacing.xs + 2,
    backgroundColor: colors.likhaYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    ...shadow.sm,
  },
  priceLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.ink,
  },
});

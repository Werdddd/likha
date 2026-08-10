import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, colors, type as t } from '../constants/theme';
import { pseudoRatioForId, splitIntoBalancedColumns } from '../lib/masonry';
import type { Creator, Listing } from '../types';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: Listing[];
  getCreator?: (creatorId: string) => Creator | undefined;
  onPressListing: (listing: Listing) => void;
  emptyLabel?: string;
}

export function ListingGrid({ listings, getCreator, onPressListing, emptyLabel }: ListingGridProps) {
  const [left, right] = useMemo(
    () => splitIntoBalancedColumns(listings, (l) => pseudoRatioForId(l.id)),
    [listings],
  );

  if (listings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel ?? 'Nothing to show yet.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        {left.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            creator={getCreator?.(listing.creatorId)}
            onPress={() => onPressListing(listing)}
          />
        ))}
      </View>
      <View style={styles.column}>
        {right.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            creator={getCreator?.(listing.creatorId)}
            onPress={() => onPressListing(listing)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
  },
});

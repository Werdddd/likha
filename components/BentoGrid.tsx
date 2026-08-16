import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../constants/theme';
import { pseudoRatioForId, splitIntoBalancedColumns } from '../lib/masonry';
import type { Creator, Listing, Project } from '../types';
import { ListingCard } from './ListingCard';
import { ProjectCard } from './ProjectCard';

export type BentoEntry = { type: 'listing'; listing: Listing } | { type: 'project'; project: Project };

interface BentoGridProps {
  items: BentoEntry[];
  getCreator?: (creatorId: string) => Creator | undefined;
  onPressListing: (listing: Listing) => void;
  onPressProject: (project: Project) => void;
}

function entryId(entry: BentoEntry): string {
  return entry.type === 'listing' ? entry.listing.id : entry.project.id;
}

/** Same balanced two-column masonry as the discover feed's MasonryGrid/ListingGrid, just mixing
 *  listing and project cards together so a shelf can hold either. */
export function BentoGrid({ items, getCreator, onPressListing, onPressProject }: BentoGridProps) {
  const [left, right] = useMemo(
    () => splitIntoBalancedColumns(items, (entry) => pseudoRatioForId(entryId(entry))),
    [items],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        {left.map((entry) => (
          <BentoEntryCard
            key={entryId(entry)}
            entry={entry}
            getCreator={getCreator}
            onPressListing={onPressListing}
            onPressProject={onPressProject}
          />
        ))}
      </View>
      <View style={styles.column}>
        {right.map((entry) => (
          <BentoEntryCard
            key={entryId(entry)}
            entry={entry}
            getCreator={getCreator}
            onPressListing={onPressListing}
            onPressProject={onPressProject}
          />
        ))}
      </View>
    </View>
  );
}

interface BentoEntryCardProps {
  entry: BentoEntry;
  getCreator?: (creatorId: string) => Creator | undefined;
  onPressListing: (listing: Listing) => void;
  onPressProject: (project: Project) => void;
}

function BentoEntryCard({ entry, getCreator, onPressListing, onPressProject }: BentoEntryCardProps) {
  if (entry.type === 'listing') {
    return (
      <ListingCard
        listing={entry.listing}
        creator={getCreator?.(entry.listing.creatorId)}
        onPress={() => onPressListing(entry.listing)}
      />
    );
  }
  return (
    <ProjectCard
      project={entry.project}
      creator={getCreator?.(entry.project.creatorId)}
      onPress={() => onPressProject(entry.project)}
    />
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
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import type { JobPost } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';

interface JobPostCardProps {
  jobPost: JobPost;
  onPress?: () => void;
}

function budgetLabel(jobPost: JobPost): string {
  if (jobPost.budgetMin === null && jobPost.budgetMax === null) {
    return jobPost.budgetFlexible ? 'Open to quotes' : 'Budget not specified';
  }
  if (jobPost.budgetMin !== null && jobPost.budgetMax !== null) {
    return `${formatPrice(jobPost.budgetMin)} – ${formatPrice(jobPost.budgetMax)}`;
  }
  const only = jobPost.budgetMin ?? jobPost.budgetMax ?? 0;
  return `From ${formatPrice(only)}`;
}

export function JobPostCard({ jobPost, onPress }: JobPostCardProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleTo={0.98}>
      <View style={styles.row}>
        <View style={styles.thumbWrap}>
          {jobPost.images[0] ? (
            <>
              <Image source={{ uri: jobPost.images[0] }} style={styles.thumb} contentFit="cover" />
              <View style={styles.refTag}>
                <Text style={styles.refTagLabel}>Ref</Text>
              </View>
            </>
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="briefcase-outline" size={18} color={colors.warmBrown} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.category}>{jobPost.category}</Text>
            </View>
            <View style={styles.deliverableRow}>
              <Ionicons
                name={jobPost.deliverableType === 'digital' ? 'cloud-outline' : 'cube-outline'}
                size={12}
                color={colors.warmBrown}
              />
              <Text style={styles.deliverable}>{jobPost.deliverableType === 'digital' ? 'Digital' : 'Physical'}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {jobPost.title}
          </Text>
          <Text style={styles.budget}>{budgetLabel(jobPost)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {jobPost.deadline && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.warmBrown} />
            <Text style={styles.metaText}>{new Date(jobPost.deadline).toLocaleDateString()}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="chatbubbles-outline" size={12} color={colors.warmBrown} />
          <Text style={styles.metaText}>
            {jobPost.offerCount} offer{jobPost.offerCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbWrap: {
    width: 64,
    height: 64,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  refTag: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(32, 32, 28, 0.6)',
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  refTagLabel: {
    ...t.caption,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.canvas,
  },
  body: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: colors.likhaYellow + '33',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  category: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.golden,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deliverable: {
    ...t.caption,
    color: colors.warmBrown,
  },
  title: {
    ...t.bodyMedium,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  budget: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...t.caption,
    color: colors.warmBrown,
  },
});

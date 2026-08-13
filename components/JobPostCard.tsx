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
      {jobPost.images[0] ? (
        <Image source={{ uri: jobPost.images[0] }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="briefcase-outline" size={22} color={colors.warmBrown} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.categoryRow}>
          <Text style={styles.category}>{jobPost.category}</Text>
          <Text style={styles.deliverable}>{jobPost.deliverableType === 'digital' ? 'Digital' : 'Physical'}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {jobPost.title}
        </Text>
        <Text style={styles.budget}>{budgetLabel(jobPost)}</Text>

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
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: colors.softGray,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.golden,
  },
  deliverable: {
    ...t.caption,
    color: colors.warmBrown,
  },
  title: {
    ...t.bodyMedium,
    color: colors.ink,
    marginTop: 2,
  },
  budget: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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

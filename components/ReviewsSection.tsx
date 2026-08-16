import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import { timeAgo } from '../lib/format';
import { useCreatorStore } from '../store/creator-store';
import type { Review } from '../types';
import { StarRating } from './StarRating';
import { Avatar } from './ui';

interface ReviewsSectionProps {
  ratingAvg: number;
  ratingCount: number;
  reviews: Review[];
}

export function ReviewsSection({ ratingAvg, ratingCount, reviews }: ReviewsSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Reviews</Text>

      {ratingCount > 0 && (
        <View style={styles.summaryRow}>
          <StarRating rating={ratingAvg} size={16} />
          <Text style={styles.summaryText}>
            {ratingAvg.toFixed(1)} · {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      )}

      {reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet.</Text>
      ) : (
        <View style={styles.list}>
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const buyer = useCreatorStore((s) => s.getCreator(review.buyerId));
  if (!buyer) return null;

  return (
    <View style={styles.reviewRow}>
      <Avatar uri={buyer.avatarUrl} size={32} />
      <View style={styles.reviewBody}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{buyer.name}</Text>
          <Text style={styles.reviewTime}>{timeAgo(review.createdAt)}</Text>
        </View>
        <StarRating rating={review.rating} size={12} />
        {review.body.length > 0 && <Text style={styles.reviewText}>{review.body}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryText: {
    ...t.caption,
    color: colors.warmBrown,
  },
  empty: {
    ...t.body,
    color: colors.warmBrown,
  },
  list: {
    gap: spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  reviewBody: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  reviewTime: {
    ...t.caption,
    color: colors.warmBrown,
  },
  reviewText: {
    ...t.body,
    color: colors.ink,
    marginTop: 4,
  },
});

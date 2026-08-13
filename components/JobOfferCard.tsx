import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { useCreatorStore } from '../store/creator-store';
import { useProjectStore } from '../store/project-store';
import type { JobOffer } from '../types';
import { AnimatedPressable, Avatar, Badge, type BadgeTone, Button, Card } from './ui';

interface JobOfferCardProps {
  offer: JobOffer;
  /** Shown to the buyer viewing offers on their own post. */
  onAccept?: () => void;
  isAccepting?: boolean;
  onReject?: () => void;
  isRejecting?: boolean;
}

const STATUS_LABELS: Record<JobOffer['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  not_selected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

const STATUS_TONES: Record<JobOffer['status'], BadgeTone> = {
  pending: 'active',
  accepted: 'positive',
  not_selected: 'muted',
  withdrawn: 'muted',
};

export function JobOfferCard({ offer, onAccept, isAccepting, onReject, isRejecting }: JobOfferCardProps) {
  const creator = useCreatorStore((s) => s.getCreator(offer.creatorId));
  const linkedProject = useProjectStore((s) => (offer.portfolioProjectId ? s.projectsById[offer.portfolioProjectId] : undefined));

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <AnimatedPressable
          style={styles.creatorRow}
          scaleTo={0.97}
          onPress={() => creator && router.push(`/creator/${creator.id}`)}
        >
          <Avatar uri={creator?.avatarUrl ?? ''} size={32} />
          <Text style={styles.creatorName} numberOfLines={1}>
            {creator?.name ?? 'Creator'}
          </Text>
        </AnimatedPressable>
        <Badge label={STATUS_LABELS[offer.status]} tone={STATUS_TONES[offer.status]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.price}>{formatPrice(offer.price)}</Text>
        <View style={styles.turnaround}>
          <Ionicons name="time-outline" size={13} color={colors.warmBrown} />
          <Text style={styles.turnaroundLabel}>
            {offer.turnaroundDays} day{offer.turnaroundDays === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <Text style={styles.pitch}>{offer.pitch}</Text>

      {linkedProject && (
        <AnimatedPressable
          style={styles.projectLink}
          scaleTo={0.98}
          onPress={() => router.push(`/project/${linkedProject.id}`)}
        >
          <Ionicons name="sparkles-outline" size={14} color={colors.ink} />
          <Text style={styles.projectLinkLabel} numberOfLines={1}>
            {linkedProject.title}
          </Text>
        </AnimatedPressable>
      )}

      {(onAccept || onReject) && offer.status === 'pending' && (
        <View style={styles.actionRow}>
          {onReject && (
            <Button
              label={isRejecting ? 'Rejecting…' : 'Reject'}
              variant="ghost"
              onPress={onReject}
              disabled={isRejecting || isAccepting}
              style={styles.actionButton}
            />
          )}
          {onAccept && (
            <Button
              label={isAccepting ? 'Accepting…' : 'Accept Offer'}
              onPress={onAccept}
              disabled={isAccepting || isRejecting}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  price: {
    ...t.h3,
    color: colors.ink,
  },
  turnaround: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  turnaroundLabel: {
    ...t.caption,
    color: colors.warmBrown,
  },
  pitch: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  projectLinkLabel: {
    ...t.caption,
    color: colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  actionButton: {
    flex: 1,
  },
});

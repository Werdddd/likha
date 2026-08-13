import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { JobOfferCard } from '../../components/JobOfferCard';
import { JobPostCommentsSheet } from '../../components/JobPostCommentsSheet';
import { AnimatedPressable, Badge, type BadgeTone, Button, Card } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { useJobOfferStore } from '../../store/job-offer-store';
import { useJobOrderStore } from '../../store/job-order-store';
import { useJobPostStore } from '../../store/job-post-store';
import { useSessionStore } from '../../store/session-store';
import type { JobOffer, JobPost } from '../../types';

const EMPTY_OFFERS: JobOffer[] = [];

const POST_STATUS_LABELS: Record<JobPost['status'], string> = {
  open: 'Open',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

const POST_STATUS_TONES: Record<JobPost['status'], BadgeTone> = {
  open: 'active',
  fulfilled: 'positive',
  cancelled: 'muted',
};

export default function JobPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);

  const jobPost = useJobPostStore((s) => s.jobPostsById[id]);
  const fetchById = useJobPostStore((s) => s.fetchById);

  const offers = useJobOfferStore((s) => s.offersByJobPost[id] ?? EMPTY_OFFERS);
  const fetchOffersForPost = useJobOfferStore((s) => s.fetchOffersForPost);

  const acceptOffer = useJobOrderStore((s) => s.acceptOffer);
  const rejectOffer = useJobOfferStore((s) => s.rejectOffer);
  const fetchJobOrderByJobPostId = useJobOrderStore((s) => s.fetchJobOrderByJobPostId);
  const subscribeToJobPost = useJobPostStore((s) => s.subscribeToJobPost);
  const subscribeToJobPostOffers = useJobOfferStore((s) => s.subscribeToJobPostOffers);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [rejectingOfferId, setRejectingOfferId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linkedJobOrderId, setLinkedJobOrderId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobPost) fetchById(id);
  }, [id, jobPost, fetchById]);

  useEffect(() => {
    if (id) fetchOffersForPost(id);
  }, [id, fetchOffersForPost]);

  // Live-sync: the buyer accepting an offer flips this post's status and the other offers'
  // statuses for every creator (and the buyer, on another device) already viewing this screen.
  useEffect(() => {
    if (!id) return;
    const unsubscribePost = subscribeToJobPost(id);
    const unsubscribeOffers = subscribeToJobPostOffers(id);
    return () => {
      unsubscribePost();
      unsubscribeOffers();
    };
  }, [id, subscribeToJobPost, subscribeToJobPostOffers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchById(id), fetchOffersForPost(id)]);
    setRefreshing(false);
  }, [id, fetchById, fetchOffersForPost]);

  const isBuyer = jobPost?.buyerId === currentUserId;
  const myOffer = useMemo(() => offers.find((o) => o.creatorId === currentUserId), [offers, currentUserId]);
  const visibleOffers = useMemo(() => offers.filter((o) => o.status !== 'withdrawn'), [offers]);
  const canViewOrder = isBuyer || myOffer?.status === 'accepted';

  // Once the post is fulfilled, look up the resulting order so the buyer and the winning
  // creator get a direct link to it instead of a dead end.
  useEffect(() => {
    if (jobPost?.status === 'fulfilled' && canViewOrder) {
      fetchJobOrderByJobPostId(jobPost.id).then((order) => setLinkedJobOrderId(order?.id ?? null));
    }
  }, [jobPost?.status, jobPost?.id, canViewOrder, fetchJobOrderByJobPostId]);

  if (!jobPost) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Job Post' }} />
        <Text style={styles.body}>Job post not found.</Text>
      </SafeAreaView>
    );
  }

  const handleAccept = async (offerId: string) => {
    setAcceptingOfferId(offerId);
    const { jobOrder, error } = await acceptOffer(offerId);
    setAcceptingOfferId(null);
    if (!jobOrder) {
      Alert.alert('Could not accept this offer', error ?? 'Please try again.');
      return;
    }
    router.replace(`/job-order/${jobOrder.id}`);
  };

  const handleReject = (offerId: string) => {
    Alert.alert('Reject this offer?', 'The creator will see their offer marked as not selected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setRejectingOfferId(offerId);
          const { error } = await rejectOffer(offerId);
          setRejectingOfferId(null);
          if (error) Alert.alert('Could not reject this offer', error);
        },
      },
    ]);
  };

  const budgetText =
    jobPost.budgetMin !== null && jobPost.budgetMax !== null
      ? `${formatPrice(jobPost.budgetMin)} – ${formatPrice(jobPost.budgetMax)}`
      : jobPost.budgetMin !== null
        ? `From ${formatPrice(jobPost.budgetMin)}`
        : jobPost.budgetMax !== null
          ? `Up to ${formatPrice(jobPost.budgetMax)}`
          : 'Open to quotes';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: jobPost.title }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Card style={styles.card}>
          <View style={styles.tagRow}>
            <View style={styles.tagRowLeft}>
              <Text style={styles.category}>{jobPost.category}</Text>
              <Text style={styles.deliverable}>
                {jobPost.deliverableType === 'digital' ? 'Digital' : 'Physical'}
              </Text>
            </View>
            <Badge label={POST_STATUS_LABELS[jobPost.status]} tone={POST_STATUS_TONES[jobPost.status]} />
          </View>
          <Text style={styles.title}>{jobPost.title}</Text>
          <Text style={styles.description}>{jobPost.description}</Text>

          {jobPost.images.length > 0 && (
            <View style={styles.referenceSection}>
              <Text style={styles.referenceLabel}>
                Reference image{jobPost.images.length === 1 ? '' : 's'} · for inspiration only
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {jobPost.images.map((url) => (
                  <AnimatedPressable key={url} onPress={() => setPreviewUrl(url)} scaleTo={0.95}>
                    <Image source={{ uri: url }} style={styles.referenceThumb} contentFit="cover" />
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={colors.warmBrown} />
              <Text style={styles.metaText}>{budgetText}</Text>
            </View>
            {jobPost.deadline && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.warmBrown} />
                <Text style={styles.metaText}>Due {new Date(jobPost.deadline).toLocaleDateString()}</Text>
              </View>
            )}
            {jobPost.region && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.warmBrown} />
                <Text style={styles.metaText}>{jobPost.region}</Text>
              </View>
            )}
          </View>

          <AnimatedPressable style={styles.commentsLink} scaleTo={0.98} onPress={() => setCommentsOpen(true)}>
            <Ionicons name="chatbubbles-outline" size={15} color={colors.ink} />
            <Text style={styles.commentsLinkLabel}>
              {jobPost.commentCount} comment{jobPost.commentCount === 1 ? '' : 's'} · Ask a question
            </Text>
            <Ionicons name="chevron-forward" size={15} color={colors.warmBrown} style={styles.commentsLinkChevron} />
          </AnimatedPressable>
        </Card>

        {(jobPost.status === 'fulfilled' || jobPost.status === 'cancelled') && (
          <Card style={styles.actionCard}>
            {linkedJobOrderId ? (
              <Button label="View Order" onPress={() => router.push(`/job-order/${linkedJobOrderId}`)} />
            ) : (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.warmBrown} />
                <Text style={styles.myOfferText}>
                  {jobPost.status === 'fulfilled'
                    ? canViewOrder
                      ? 'Loading your order…'
                      : 'This job has been fulfilled by another creator.'
                    : 'This job post was cancelled.'}
                </Text>
              </View>
            )}
          </Card>
        )}

        {!isBuyer && jobPost.status === 'open' && (
          <Card style={styles.actionCard}>
            {myOffer ? (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.warmBrown} />
                <Text style={styles.myOfferText}>
                  You submitted an offer of {formatPrice(myOffer.price)}. Status: {myOffer.status.replace('_', ' ')}.
                </Text>
              </View>
            ) : (
              <Button label="Submit an Offer" onPress={() => router.push(`/job-post/${jobPost.id}/offer`)} />
            )}
          </Card>
        )}

        {isBuyer && (
          <>
            <Text style={styles.sectionLabel}>
              Offers ({visibleOffers.length})
            </Text>
            {visibleOffers.length === 0 ? (
              <View style={styles.emptyOffers}>
                <ActivityIndicator size="small" color={colors.warmBrown} style={styles.emptyOffersSpinner} />
                <Text style={styles.emptyOffersText}>Waiting for creators to respond.</Text>
              </View>
            ) : (
              visibleOffers.map((offer) => (
                <JobOfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={jobPost.status === 'open' ? () => handleAccept(offer.id) : undefined}
                  isAccepting={acceptingOfferId === offer.id}
                  onReject={jobPost.status === 'open' ? () => handleReject(offer.id) : undefined}
                  isRejecting={rejectingOfferId === offer.id}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <JobPostCommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} jobPostId={jobPost.id} />
      <ImagePreviewModal visible={!!previewUrl} uri={previewUrl} onClose={() => setPreviewUrl(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {},
  referenceSection: {
    marginTop: spacing.md,
  },
  referenceLabel: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.xs,
  },
  referenceThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
    marginRight: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    ...t.h2,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metaText: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.warmBrown,
  },
  commentsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  commentsLinkLabel: {
    ...t.bodyMedium,
    color: colors.ink,
    flex: 1,
  },
  commentsLinkChevron: {
    marginLeft: -spacing.xs,
  },
  actionCard: {
    marginTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  myOfferText: {
    ...t.body,
    color: colors.warmBrown,
    flex: 1,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyOffers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  emptyOffersSpinner: {
    marginRight: spacing.xs,
  },
  emptyOffersText: {
    ...t.body,
    color: colors.warmBrown,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

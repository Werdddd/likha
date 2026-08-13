import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobOfferCard } from '../../components/JobOfferCard';
import { JobPostCommentsSheet } from '../../components/JobPostCommentsSheet';
import { AnimatedPressable, Button } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { useJobOfferStore } from '../../store/job-offer-store';
import { useJobOrderStore } from '../../store/job-order-store';
import { useJobPostStore } from '../../store/job-post-store';
import { useSessionStore } from '../../store/session-store';
import type { JobOffer } from '../../types';

const EMPTY_OFFERS: JobOffer[] = [];

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
        {jobPost.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {jobPost.images.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.image} contentFit="cover" />
            ))}
          </ScrollView>
        )}

        <View style={styles.card}>
          <View style={styles.tagRow}>
            <Text style={styles.category}>{jobPost.category}</Text>
            <Text style={styles.deliverable}>
              {jobPost.deliverableType === 'digital' ? 'Digital' : 'Physical'}
            </Text>
          </View>
          <Text style={styles.title}>{jobPost.title}</Text>
          <Text style={styles.description}>{jobPost.description}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={15} color={colors.warmBrown} />
              <Text style={styles.metaText}>{budgetText}</Text>
            </View>
            {jobPost.deadline && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color={colors.warmBrown} />
                <Text style={styles.metaText}>Due {new Date(jobPost.deadline).toLocaleDateString()}</Text>
              </View>
            )}
            {jobPost.region && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={colors.warmBrown} />
                <Text style={styles.metaText}>{jobPost.region}</Text>
              </View>
            )}
          </View>

          <AnimatedPressable style={styles.commentsLink} scaleTo={0.98} onPress={() => setCommentsOpen(true)}>
            <Ionicons name="chatbubbles-outline" size={15} color={colors.ink} />
            <Text style={styles.commentsLinkLabel}>
              {jobPost.commentCount} comment{jobPost.commentCount === 1 ? '' : 's'} · Ask a question
            </Text>
          </AnimatedPressable>
        </View>

        {(jobPost.status === 'fulfilled' || jobPost.status === 'cancelled') && (
          <View style={styles.actionCard}>
            {linkedJobOrderId ? (
              <Button label="View Order" onPress={() => router.push(`/job-order/${linkedJobOrderId}`)} />
            ) : (
              <Text style={styles.myOfferText}>
                {jobPost.status === 'fulfilled'
                  ? canViewOrder
                    ? 'Loading your order…'
                    : 'This job has been fulfilled by another creator.'
                  : 'This job post was cancelled.'}
              </Text>
            )}
          </View>
        )}

        {!isBuyer && jobPost.status === 'open' && (
          <View style={styles.actionCard}>
            {myOffer ? (
              <Text style={styles.myOfferText}>
                You submitted an offer of {formatPrice(myOffer.price)}. Status: {myOffer.status.replace('_', ' ')}.
              </Text>
            ) : (
              <Button label="Submit an Offer" onPress={() => router.push(`/job-post/${jobPost.id}/offer`)} />
            )}
          </View>
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
  imageScroll: {
    marginBottom: spacing.md,
  },
  image: {
    width: 240,
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray,
    marginRight: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: 2,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  metaGrid: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...t.body,
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
  },
  actionCard: {
    marginTop: spacing.lg,
  },
  myOfferText: {
    ...t.body,
    color: colors.warmBrown,
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

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { JobOfferCard } from '../../components/JobOfferCard';
import { JobPostCommentsSheet } from '../../components/JobPostCommentsSheet';
import { ModerationNoteSheet } from '../../components/ModerationNoteSheet';
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
  const moderateJobPost = useJobPostStore((s) => s.moderateJobPost);
  const adminDeleteJobPost = useJobPostStore((s) => s.adminDeleteJobPost);
  const isAdmin = useSessionStore((s) => s.currentUser.role === 'admin');

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
  const [noteSheet, setNoteSheet] = useState<'hide' | 'remove' | null>(null);
  const [isModerating, setIsModerating] = useState(false);

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

  const handleRestore = async () => {
    setIsModerating(true);
    const { error } = await moderateJobPost(id, 'restore');
    setIsModerating(false);
    if (error) Alert.alert('Could not restore job post', error);
  };

  const handleHideConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await moderateJobPost(id, 'hide', note);
    setIsModerating(false);
    if (error) Alert.alert('Could not hide job post', error);
  };

  const handleRemoveConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await adminDeleteJobPost(id, note);
    setIsModerating(false);
    if (error) {
      Alert.alert('Could not remove job post', error);
      return;
    }
    router.back();
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
        {(isBuyer || isAdmin) && jobPost.moderationStatus === 'rejected' && (
          <View style={styles.inactiveBanner}>
            <Ionicons name="eye-off-outline" size={14} color={colors.terracotta} />
            <Text style={styles.inactiveBannerLabel}>
              {jobPost.moderationReason
                ? `Hidden by an admin: ${jobPost.moderationReason}`
                : 'Hidden by an admin — not visible to creators.'}
            </Text>
          </View>
        )}

        {isAdmin && (
          <View style={styles.adminRow}>
            {jobPost.moderationStatus === 'rejected' ? (
              <AnimatedPressable
                style={styles.adminButton}
                scaleTo={0.96}
                disabled={isModerating}
                onPress={handleRestore}
              >
                <Ionicons name="eye-outline" size={14} color={colors.ink} />
                <Text style={styles.adminButtonLabel}>{isModerating ? 'Working…' : 'Restore'}</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                style={styles.adminButton}
                scaleTo={0.96}
                disabled={isModerating}
                onPress={() => setNoteSheet('hide')}
              >
                <Ionicons name="eye-off-outline" size={14} color={colors.ink} />
                <Text style={styles.adminButtonLabel}>Hide</Text>
              </AnimatedPressable>
            )}
            <AnimatedPressable
              style={[styles.adminButton, styles.adminButtonDestructive]}
              scaleTo={0.96}
              disabled={isModerating}
              onPress={() => setNoteSheet('remove')}
            >
              <Ionicons name="trash-outline" size={14} color={colors.terracotta} />
              <Text style={[styles.adminButtonLabel, styles.adminButtonLabelDestructive]}>Remove</Text>
            </AnimatedPressable>
          </View>
        )}

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
          <View style={styles.titleRow}>
            <Text style={[styles.title, styles.titleFlex]}>{jobPost.title}</Text>
            {isBuyer && jobPost.status === 'open' && (
              <AnimatedPressable
                style={styles.editButton}
                onPress={() => router.push(`/job-post/${jobPost.id}/edit`)}
                scaleTo={0.92}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.ink} />
              </AnimatedPressable>
            )}
          </View>
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

      <ModerationNoteSheet
        visible={noteSheet === 'hide'}
        title="Hide this job post"
        body="The buyer will be notified with your reason. They can still see it themselves; nobody else can."
        confirmLabel="Hide"
        onCancel={() => setNoteSheet(null)}
        onConfirm={handleHideConfirm}
      />
      <ModerationNoteSheet
        visible={noteSheet === 'remove'}
        title="Remove this job post"
        body="This permanently deletes it. The buyer will be notified with your reason."
        confirmLabel="Remove"
        onCancel={() => setNoteSheet(null)}
        onConfirm={handleRemoveConfirm}
      />
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
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.terracotta + '1a',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  inactiveBannerLabel: {
    ...t.caption,
    color: colors.terracotta,
    flex: 1,
  },
  adminRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  adminButtonDestructive: {
    backgroundColor: colors.terracotta + '1a',
  },
  adminButtonLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  adminButtonLabelDestructive: {
    color: colors.terracotta,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleFlex: {
    flex: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGray + '4d',
  },
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

import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MediaStackCarousel } from '../../components/MediaStackCarousel';
import { ModerationNoteSheet } from '../../components/ModerationNoteSheet';
import { ReviewsSection } from '../../components/ReviewsSection';
import { SaveToShelfSheet } from '../../components/SaveToShelfSheet';
import { AnimatedPressable, Avatar, Button, QuantityStepper } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { useCartStore } from '../../store/cart-store';
import { useCreatorStore } from '../../store/creator-store';
import { useListingStore } from '../../store/listing-store';
import { useProjectStore } from '../../store/project-store';
import { useReviewStore } from '../../store/review-store';
import { useSessionStore } from '../../store/session-store';
import { useShelfStore } from '../../store/shelf-store';
import type { Listing, Project, Review } from '../../types';

const EMPTY_REVIEWS: Review[] = [];

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const cachedListing = useListingStore((s) => s.listingsById[id]);
  const fetchListingById = useListingStore((s) => s.fetchById);
  const fetchProjectById = useProjectStore((s) => s.fetchById);
  const moderateListing = useListingStore((s) => s.moderateListing);
  const adminDeleteListing = useListingStore((s) => s.adminDeleteListing);
  const creator = useCreatorStore((s) => (cachedListing ? s.getCreator(cachedListing.creatorId) : undefined));
  const addItem = useCartStore((s) => s.addItem);
  const reviews = useReviewStore((s) => s.reviewsByListing[id] ?? EMPTY_REVIEWS);
  const fetchReviewsForListing = useReviewStore((s) => s.fetchReviewsForListing);
  const currentUser = useSessionStore((s) => s.currentUser);
  const currentUserId = currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const isSaved = useShelfStore((s) => !!s.savedListingIds[id]);

  const [listing, setListing] = useState<Listing | null | undefined>(cachedListing);
  const [linkedProject, setLinkedProject] = useState<Project | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [noteSheet, setNoteSheet] = useState<'hide' | 'remove' | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const insets = useSafeAreaInsets();

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.96);

  useEffect(() => {
    if (cachedListing) {
      setListing(cachedListing);
    } else {
      fetchListingById(id).then(setListing);
    }
  }, [id, cachedListing, fetchListingById]);

  useEffect(() => {
    fetchReviewsForListing(id);
  }, [id, fetchReviewsForListing]);

  useEffect(() => {
    if (!listing?.projectId) {
      setLinkedProject(null);
      return;
    }
    fetchProjectById(listing.projectId).then(setLinkedProject);
  }, [listing?.projectId, fetchProjectById]);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 320 });
    heroScale.value = withTiming(1, { duration: 320 });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  const media = useMemo(
    () => (listing?.images ?? []).map((url, index) => ({ id: `${listing?.id}-${index}`, type: 'image' as const, url })),
    [listing?.id, listing?.images],
  );

  if (listing === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Listing' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Listing' }} />
        <Text style={styles.body}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  const isDigital = listing.productType === 'digital';
  const soldOut = !isDigital && listing.stock === 0;
  const isOwner = listing.creatorId === currentUserId;

  const handleAddToCart = () => {
    const { error } = addItem(listing.id, quantity);
    if (error) Alert.alert('Could not add to cart', error);
  };
  const handleBuyNow = () => {
    const { error } = addItem(listing.id, quantity);
    if (error) {
      Alert.alert('Could not buy', error);
      return;
    }
    router.push('/checkout');
  };

  const handleRestore = async () => {
    setIsModerating(true);
    const { error } = await moderateListing(id, 'restore');
    setIsModerating(false);
    if (error) Alert.alert('Could not restore listing', error);
  };

  const handleHideConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await moderateListing(id, 'hide', note);
    setIsModerating(false);
    if (error) Alert.alert('Could not hide listing', error);
  };

  const handleRemoveConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await adminDeleteListing(id, note);
    setIsModerating(false);
    if (error) {
      Alert.alert('Could not remove listing', error);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        <Animated.View style={heroStyle}>
          <MediaStackCarousel media={media} />
        </Animated.View>

        <View style={styles.content}>
          {(isOwner || isAdmin) && listing.moderationStatus === 'rejected' && (
            <View style={styles.inactiveBanner}>
              <Ionicons name="eye-off-outline" size={14} color={colors.terracotta} />
              <Text style={styles.inactiveBannerLabel}>
                {listing.moderationReason
                  ? `Hidden by an admin: ${listing.moderationReason}`
                  : 'Hidden by an admin — not visible to buyers.'}
              </Text>
            </View>
          )}

          {isOwner && !listing.isActive && (
            <View style={styles.inactiveBanner}>
              <Ionicons name="eye-off-outline" size={14} color={colors.terracotta} />
              <Text style={styles.inactiveBannerLabel}>Deactivated — only you can see this listing.</Text>
            </View>
          )}

          {isAdmin && (
            <View style={styles.adminRow}>
              {listing.moderationStatus === 'rejected' ? (
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

          <View style={styles.titleRow}>
            <Text style={[styles.title, styles.titleFlex]}>{listing.title}</Text>
            {isOwner && (
              <AnimatedPressable
                style={styles.editButton}
                onPress={() => router.push(`/listing/${listing.id}/edit`)}
                scaleTo={0.92}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.ink} />
              </AnimatedPressable>
            )}
          </View>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>

          {creator && (
            <Link href={`/creator/${creator.id}`} asChild>
              <AnimatedPressable style={styles.creatorRow} scaleTo={0.98}>
                <Avatar uri={creator.avatarUrl} size={36} bordered />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorMeta}>{creator.region}</Text>
                </View>
              </AnimatedPressable>
            </Link>
          )}

          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.tagRow}>
            <View style={styles.productTypeTag}>
              <Ionicons
                name={isDigital ? 'cloud-download-outline' : 'cube-outline'}
                size={12}
                color={colors.ink}
              />
              <Text style={styles.productTypeTagLabel}>{isDigital ? 'Digital' : 'Physical'}</Text>
            </View>
            <Text style={styles.tag}>{listing.category}</Text>
            {listing.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <Text style={styles.stock}>
            {isDigital
              ? listing.digitalFileName
                ? `Instant download after purchase · ${listing.digitalFileName}`
                : 'Instant download after purchase'
              : soldOut
                ? 'Sold out'
                : listing.stock === null
                  ? 'Made to order'
                  : `${listing.stock} in stock`}
          </Text>

          {linkedProject && (
            <Link href={`/project/${linkedProject.id}`} asChild>
              <AnimatedPressable style={styles.projectLink} scaleTo={0.98}>
                <Ionicons name="sparkles-outline" size={16} color={colors.ink} />
                <Text style={styles.projectLinkLabel}>From the project: {linkedProject.title}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.warmBrown} />
              </AnimatedPressable>
            </Link>
          )}

          {isOwner ? (
            <Text style={styles.ownerNote}>This is your listing — you can't buy your own products.</Text>
          ) : (
            <>
              {!soldOut && !isDigital && (
                <View style={styles.purchaseRow}>
                  <Text style={styles.sectionLabel}>Quantity</Text>
                  <QuantityStepper quantity={quantity} onChange={setQuantity} max={listing.stock ?? 99} />
                </View>
              )}

              <View style={styles.actionsRow}>
                <Button
                  label={soldOut ? 'Sold Out' : 'Add to Cart'}
                  variant="secondary"
                  disabled={soldOut}
                  onPress={handleAddToCart}
                  style={styles.actionButton}
                />
                <Button
                  label={isDigital ? 'Buy & Download' : 'Buy Now'}
                  disabled={soldOut}
                  onPress={handleBuyNow}
                  style={styles.actionButton}
                />
              </View>
            </>
          )}

          <ReviewsSection ratingAvg={listing.ratingAvg} ratingCount={listing.ratingCount} reviews={reviews} />
        </View>
      </ScrollView>

      <AnimatedPressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        scaleTo={0.9}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </AnimatedPressable>

      {!isOwner && (
        <AnimatedPressable
          style={[styles.saveButton, { top: insets.top + spacing.sm }]}
          onPress={() => setSaveSheetVisible(true)}
          scaleTo={0.9}
        >
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? colors.golden : colors.ink} />
        </AnimatedPressable>
      )}

      <SaveToShelfSheet visible={saveSheetVisible} onClose={() => setSaveSheetVisible(false)} listingId={listing.id} />

      <ModerationNoteSheet
        visible={noteSheet === 'hide'}
        title="Hide this listing"
        body="The creator will be notified with your reason. They can still see it themselves; nobody else can."
        confirmLabel="Hide"
        onCancel={() => setNoteSheet(null)}
        onConfirm={handleHideConfirm}
      />
      <ModerationNoteSheet
        visible={noteSheet === 'remove'}
        title="Remove this listing"
        body="This permanently deletes it. The creator will be notified with your reason."
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
  loading: {
    marginTop: spacing.xl,
  },
  content: {
    padding: spacing.lg,
  },
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
  title: {
    ...t.h1,
    color: colors.ink,
  },
  price: {
    ...t.h2,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.golden,
    marginTop: spacing.xs,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creatorMeta: {
    ...t.caption,
    color: colors.warmBrown,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  productTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.likhaYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  productTypeTagLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  tag: {
    ...t.caption,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stock: {
    ...t.label,
    color: colors.warmBrown,
    marginTop: spacing.md,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
  },
  projectLinkLabel: {
    ...t.caption,
    color: colors.ink,
    flex: 1,
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  ownerNote: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  saveButton: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

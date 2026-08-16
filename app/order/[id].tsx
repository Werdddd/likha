import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../../components/ui';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { ProductTypeTag } from '../../components/ProductTypeTag';
import { ReviewSheet } from '../../components/ReviewSheet';
import { StarRating } from '../../components/StarRating';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import {
  canCancelOrder,
  isTerminalStatus,
  orderHasPhysicalItems,
  orderStatusColor,
  orderStatusLabel,
} from '../../lib/order-status';
import { getSignedUrl } from '../../lib/upload';
import { useListingStore } from '../../store/listing-store';
import { useMessageStore } from '../../store/message-store';
import { useOrderStore } from '../../store/order-store';
import { useReviewStore } from '../../store/review-store';
import { useSessionStore } from '../../store/session-store';
import type { ListingLink, OrderItem } from '../../types';

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  gcash: 'GCash',
  card: 'Card',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id));
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const getDigitalDownloadUrl = useOrderStore((s) => s.getDigitalDownloadUrl);
  const getDigitalLinks = useOrderStore((s) => s.getDigitalLinks);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const listingsById = useListingStore((s) => s.listingsById);
  const fetchListingById = useListingStore((s) => s.fetchById);
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const myReviewsByOrderItem = useReviewStore((s) => s.myReviewsByOrderItem);
  const fetchMyReviewsForOrder = useReviewStore((s) => s.fetchMyReviewsForOrder);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [linksByListingId, setLinksByListingId] = useState<Record<string, ListingLink[]>>({});
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    orderItemId: string;
    listingId: string;
    creatorId: string;
    itemTitle: string;
    itemCoverUrl: string;
  } | null>(null);
  const [isResolvingReviewTarget, setIsResolvingReviewTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!order) fetchOrders();
  }, [order, fetchOrders]);

  useEffect(() => {
    if (!order || order.status !== 'delivered') return;
    const itemIds = order.items.map((item) => item.id).filter((itemId): itemId is string => !!itemId);
    if (itemIds.length > 0) fetchMyReviewsForOrder(currentUserId, itemIds);
  }, [order, currentUserId, fetchMyReviewsForOrder]);

  useEffect(() => {
    if (!order?.paymentProofPath) return;
    setIsLoadingProof(true);
    getSignedUrl('payment-proofs', order.paymentProofPath).then((url) => {
      setProofUrl(url);
      setIsLoadingProof(false);
    });
  }, [order?.paymentProofPath]);

  useEffect(() => {
    if (!order || order.status !== 'delivered') return;
    const digitalListingIds = order.items
      .filter((item) => item.productType === 'digital')
      .map((item) => item.listingId);
    digitalListingIds.forEach((listingId) => {
      if (linksByListingId[listingId]) return;
      getDigitalLinks(listingId).then((links) => {
        if (links.length > 0) setLinksByListingId((prev) => ({ ...prev, [listingId]: links }));
      });
    });
  }, [order?.status, order?.items, getDigitalLinks]);

  if (!order) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Order' }} />
        <Text style={styles.body}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const handleDownload = async (listingId: string) => {
    setDownloadingId(listingId);
    const url = await getDigitalDownloadUrl(listingId);
    setDownloadingId(null);

    if (!url) {
      Alert.alert('Download unavailable', 'This file could not be retrieved right now.');
      return;
    }
    Linking.openURL(url);
  };

  const handleOpenLink = (url: string) => Linking.openURL(url);

  const handleCancel = () => {
    Alert.alert('Cancel this order?', 'The seller will be notified and any reserved stock is released.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          const { error } = await cancelOrder(order.id);
          setIsCancelling(false);
          if (error) Alert.alert('Could not cancel order', error);
        },
      },
    ]);
  };

  const handleContactSeller = async () => {
    const physicalItem = order.items.find((item) => item.productType === 'physical');
    if (!physicalItem) return;

    setIsContactingSeller(true);
    const listing = listingsById[physicalItem.listingId] ?? (await fetchListingById(physicalItem.listingId));
    if (!listing) {
      setIsContactingSeller(false);
      Alert.alert('Could not open chat', 'This listing is no longer available.');
      return;
    }

    const conversationId = await getOrCreateConversation(listing.creatorId);
    setIsContactingSeller(false);
    if (!conversationId) {
      Alert.alert('Could not open chat', 'Please try again.');
      return;
    }
    router.push(`/message/${conversationId}`);
  };

  const handleOpenReview = async (item: OrderItem) => {
    if (!item.id || !item.listingId) return;

    setIsResolvingReviewTarget(item.id);
    const listing = listingsById[item.listingId] ?? (await fetchListingById(item.listingId));
    setIsResolvingReviewTarget(null);
    if (!listing) {
      Alert.alert('Could not open review', 'This listing is no longer available.');
      return;
    }

    setReviewTarget({
      orderItemId: item.id,
      listingId: item.listingId,
      creatorId: listing.creatorId,
      itemTitle: item.title,
      itemCoverUrl: item.coverUrl,
    });
  };

  const hasPhysicalItems = orderHasPhysicalItems(order.items);
  const terminal = isTerminalStatus(order.status);
  const badgeColor = orderStatusColor(order.status);
  const reviewableItems = order.items.filter(
    (item): item is OrderItem & { id: string } => !!item.id && !!item.listingId,
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Order #${order.id.slice(-6)}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderDate}>Placed {new Date(order.createdAt).toLocaleString()}</Text>

        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badgeColor.fg }]}>
              {orderStatusLabel(order.status, hasPhysicalItems)}
            </Text>
          </View>
          {terminal ? (
            <Text style={styles.terminalText}>
              {order.status === 'rejected'
                ? 'The seller was unable to fulfill this order and rejected it.'
                : 'This order was cancelled.'}
            </Text>
          ) : (
            <View style={styles.timelineWrap}>
              <OrderStatusTimeline status={order.status} hasPhysicalItems={hasPhysicalItems} />
            </View>
          )}

          {hasPhysicalItems && !terminal && (
            <Text style={styles.deliveryHint}>
              Delivery for physical items isn't tracked in-app — message the seller to coordinate handoff or
              courier details.
            </Text>
          )}

          {(hasPhysicalItems || canCancelOrder(order.status)) && !terminal && (
            <View style={styles.actionRow}>
              {hasPhysicalItems && (
                <Button
                  label={isContactingSeller ? 'Opening…' : 'Contact Seller'}
                  variant="secondary"
                  disabled={isContactingSeller}
                  onPress={handleContactSeller}
                  style={styles.actionButton}
                />
              )}
              {canCancelOrder(order.status) && (
                <Button
                  label={isCancelling ? 'Cancelling…' : 'Cancel Order'}
                  variant="ghost"
                  disabled={isCancelling}
                  onPress={handleCancel}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}
        </View>

        {order.status === 'delivered' && reviewableItems.length > 0 && (
          <View style={styles.rateCard}>
            <View style={styles.rateCardHeader}>
              <View style={styles.rateCardIconWrap}>
                <Ionicons name="star" size={16} color={colors.golden} />
              </View>
              <View style={styles.rateCardHeaderText}>
                <Text style={styles.rateCardTitle}>Rate your order</Text>
                <Text style={styles.rateCardSubtitle}>Help other buyers by rating what you got.</Text>
              </View>
            </View>

            {reviewableItems.map((item, index) => {
              const myReview = myReviewsByOrderItem[item.id];
              return (
                <View
                  key={item.id}
                  style={[styles.rateItemRow, index < reviewableItems.length - 1 && styles.rateItemDivider]}
                >
                  <Image source={{ uri: item.coverUrl }} style={styles.rateItemThumb} contentFit="cover" />
                  <Text style={styles.rateItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {myReview ? (
                    <AnimatedPressable
                      style={styles.rateDoneButton}
                      scaleTo={0.95}
                      onPress={() => handleOpenReview(item)}
                      disabled={isResolvingReviewTarget === item.id}
                    >
                      <StarRating rating={myReview.rating} size={13} />
                      <Text style={styles.rateEditLabel}>Edit</Text>
                    </AnimatedPressable>
                  ) : (
                    <AnimatedPressable
                      style={styles.rateCtaButton}
                      scaleTo={0.95}
                      onPress={() => handleOpenReview(item)}
                      disabled={isResolvingReviewTarget === item.id}
                    >
                      {isResolvingReviewTarget === item.id ? (
                        <ActivityIndicator size="small" color={colors.ink} />
                      ) : (
                        <>
                          <Ionicons name="star-outline" size={14} color={colors.ink} />
                          <Text style={styles.rateCtaLabel}>Rate</Text>
                        </>
                      )}
                    </AnimatedPressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => {
            const isDigital = item.productType === 'digital';
            const canDownload = isDigital && order.status === 'delivered';
            return (
              <View
                key={item.listingId}
                style={[styles.itemRow, index < order.items.length - 1 && styles.itemDivider]}
              >
                <Image source={{ uri: item.coverUrl }} style={styles.itemThumb} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPrice(item.price)}
                  </Text>
                  <ProductTypeTag productType={item.productType} />
                  {canDownload ? (
                    <>
                      <View style={styles.deliverableRow}>
                        <Text style={styles.deliverableLabel}>Download:</Text>
                        <AnimatedPressable
                          style={styles.downloadButton}
                          scaleTo={0.95}
                          onPress={() => handleDownload(item.listingId)}
                          disabled={downloadingId === item.listingId}
                        >
                          {downloadingId === item.listingId ? (
                            <ActivityIndicator size="small" color={colors.ink} />
                          ) : (
                            <>
                              <Ionicons name="cloud-download-outline" size={13} color={colors.ink} />
                              <Text style={styles.downloadButtonLabel} numberOfLines={1}>
                                File
                              </Text>
                            </>
                          )}
                        </AnimatedPressable>
                      </View>
                      {(linksByListingId[item.listingId] ?? []).length > 0 && (
                        <View style={styles.deliverableRow}>
                          <Text style={styles.deliverableLabel}>Links:</Text>
                          {(linksByListingId[item.listingId] ?? []).map((link) => (
                            <AnimatedPressable
                              key={link.id}
                              style={styles.downloadButton}
                              scaleTo={0.95}
                              onPress={() => handleOpenLink(link.url)}
                            >
                              <Ionicons name="link-outline" size={13} color={colors.ink} />
                              <Text style={styles.downloadButtonLabel} numberOfLines={1}>
                                {link.label || 'Open link'}
                              </Text>
                            </AnimatedPressable>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    isDigital &&
                    !isTerminalStatus(order.status) && (
                      <View style={styles.downloadPending}>
                        <Ionicons name="time-outline" size={12} color={colors.warmBrown} />
                        <Text style={styles.downloadPendingLabel}>Available once the seller completes this order</Text>
                      </View>
                    )
                  )}
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.shippingFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {order.address && (
          <>
            <Text style={styles.sectionLabel}>Shipping address</Text>
            <View style={styles.card}>
              <Text style={styles.addressName}>{order.address.fullName}</Text>
              <Text style={styles.addressLine}>{order.address.phone}</Text>
              <Text style={styles.addressLine}>
                {order.address.line1}, {order.address.city}, {order.address.region} {order.address.postalCode}
              </Text>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={styles.card}>
          <Text style={styles.addressLine}>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</Text>
          <View style={styles.verifiedRow}>
            <Ionicons
              name={order.paymentVerified ? 'checkmark-circle' : 'time-outline'}
              size={15}
              color={order.paymentVerified ? colors.golden : colors.warmBrown}
            />
            <Text style={[styles.verifiedText, order.paymentVerified && styles.verifiedTextDone]}>
              {order.paymentVerified ? 'Payment verified by seller' : 'Awaiting seller verification'}
            </Text>
          </View>
          {isLoadingProof ? (
            <ActivityIndicator size="small" color={colors.ink} style={styles.proofImage} />
          ) : (
            proofUrl && (
              <AnimatedPressable onPress={() => setIsPreviewOpen(true)} scaleTo={0.98}>
                <Image source={{ uri: proofUrl }} style={styles.proofImage} contentFit="cover" />
                <View style={styles.expandHint}>
                  <Ionicons name="expand-outline" size={13} color={colors.white} />
                  <Text style={styles.expandHintText}>Tap to view</Text>
                </View>
              </AnimatedPressable>
            )
          )}
        </View>
      </ScrollView>

      <ImagePreviewModal visible={isPreviewOpen} uri={proofUrl} onClose={() => setIsPreviewOpen(false)} />

      {reviewTarget && (
        <ReviewSheet
          visible={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          orderItemId={reviewTarget.orderItemId}
          listingId={reviewTarget.listingId}
          creatorId={reviewTarget.creatorId}
          buyerId={currentUserId}
          itemTitle={reviewTarget.itemTitle}
          itemCoverUrl={reviewTarget.itemCoverUrl}
          existingReview={myReviewsByOrderItem[reviewTarget.orderItemId]}
        />
      )}
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
  orderDate: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  terminalText: {
    ...t.bodyMedium,
    color: colors.terracotta,
    marginTop: spacing.md,
  },
  timelineWrap: {
    marginTop: spacing.md,
  },
  deliveryHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemTitle: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  itemMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deliverableLabel: {
    ...t.caption,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 170,
    backgroundColor: colors.likhaYellow + '33',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  downloadButtonLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
    flexShrink: 1,
  },
  downloadPending: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.xs,
    maxWidth: 180,
  },
  downloadPendingLabel: {
    ...t.caption,
    fontSize: 11,
    color: colors.warmBrown,
    flexShrink: 1,
  },
  rateCard: {
    backgroundColor: colors.likhaYellow + '1a',
    borderWidth: 1,
    borderColor: colors.likhaYellow + '66',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  rateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rateCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateCardHeaderText: {
    flex: 1,
  },
  rateCardTitle: {
    ...t.bodyMedium,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.ink,
  },
  rateCardSubtitle: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 1,
  },
  rateItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rateItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.likhaYellow + '4d',
  },
  rateItemThumb: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.softGray,
  },
  rateItemTitle: {
    ...t.body,
    color: colors.ink,
    flex: 1,
  },
  rateCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.likhaYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  rateCtaLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  rateDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  rateEditLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.warmBrown,
  },
  itemTotal: {
    ...t.body,
    color: colors.ink,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
    marginVertical: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...t.body,
    color: colors.warmBrown,
  },
  summaryValue: {
    ...t.body,
    color: colors.ink,
  },
  totalLabel: {
    ...t.h3,
    color: colors.ink,
  },
  totalValue: {
    ...t.h3,
    color: colors.ink,
  },
  addressName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  addressLine: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  verifiedText: {
    ...t.caption,
    color: colors.warmBrown,
  },
  verifiedTextDone: {
    color: colors.golden,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  proofImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
    marginTop: spacing.md,
  },
  expandHint: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink + 'B3',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  expandHintText: {
    ...t.caption,
    fontSize: 11,
    color: colors.white,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

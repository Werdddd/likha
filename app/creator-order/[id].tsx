import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { ProductTypeTag } from '../../components/ProductTypeTag';
import { AnimatedPressable, Button } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import {
  canRejectOrder,
  isTerminalStatus,
  nextOrderStatus,
  orderHasPhysicalItems,
  orderStatusColor,
  orderStatusLabel,
} from '../../lib/order-status';
import { getSignedUrl } from '../../lib/upload';
import { useDashboardStore } from '../../store/dashboard-store';
import { useMessageStore } from '../../store/message-store';
import { useSessionStore } from '../../store/session-store';

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  gcash: 'GCash',
  card: 'Card',
};

export default function CreatorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const order = useDashboardStore((s) => s.orders.find((o) => o.id === id));
  const fetchDashboard = useDashboardStore((s) => s.fetchDashboard);
  const updateOrderStatus = useDashboardStore((s) => s.updateOrderStatus);
  const verifyPayment = useDashboardStore((s) => s.verifyPayment);
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isContactingBuyer, setIsContactingBuyer] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!order && currentUserId) fetchDashboard(currentUserId);
  }, [order, currentUserId, fetchDashboard]);

  useEffect(() => {
    if (!order?.paymentProofPath) return;
    setIsLoadingProof(true);
    getSignedUrl('payment-proofs', order.paymentProofPath).then((url) => {
      setProofUrl(url);
      setIsLoadingProof(false);
    });
  }, [order?.paymentProofPath]);

  if (!order) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Order' }} />
        <Text style={styles.body}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const hasPhysicalItems = orderHasPhysicalItems(order.items);
  const terminal = isTerminalStatus(order.status);
  const badgeColor = orderStatusColor(order.status);
  const next = nextOrderStatus(order.status, hasPhysicalItems);
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAdvance = async () => {
    if (!next) return;
    setIsUpdating(true);
    const { error } = await updateOrderStatus(order.id, next);
    setIsUpdating(false);
    if (error) Alert.alert('Could not update order', error);
  };

  const handleReject = () => {
    Alert.alert('Reject this order?', 'The buyer will see this order as rejected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setIsUpdating(true);
          const { error } = await updateOrderStatus(order.id, 'rejected');
          setIsUpdating(false);
          if (error) Alert.alert('Could not reject order', error);
        },
      },
    ]);
  };

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    const { error } = await verifyPayment(order.id);
    setIsVerifying(false);
    if (error) Alert.alert('Could not verify payment', error);
  };

  const handleContactBuyer = async () => {
    setIsContactingBuyer(true);
    const conversationId = await getOrCreateConversation(order.buyerId);
    setIsContactingBuyer(false);
    if (!conversationId) {
      Alert.alert('Could not open chat', 'Please try again.');
      return;
    }
    router.push(`/message/${conversationId}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Order #${order.id.slice(-6)}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderDate}>Placed {new Date(order.createdAt).toLocaleString()}</Text>

        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor.bg }]}>
            <Text style={[styles.statusLabel, { color: badgeColor.fg }]}>
              {orderStatusLabel(order.status, hasPhysicalItems)}
            </Text>
          </View>
          {terminal ? (
            <Text style={styles.terminalText}>
              {order.status === 'rejected' ? 'You rejected this order.' : 'This order was cancelled.'}
            </Text>
          ) : (
            <View style={styles.timelineWrap}>
              <OrderStatusTimeline status={order.status} hasPhysicalItems={hasPhysicalItems} />
            </View>
          )}

          {hasPhysicalItems && (
            <>
              <Text style={styles.deliveryHint}>
                Delivery isn't tracked in-app — message the buyer to coordinate handoff or courier details.
              </Text>
              <Button
                label={isContactingBuyer ? 'Opening…' : 'Contact Buyer'}
                variant="secondary"
                disabled={isContactingBuyer}
                onPress={handleContactBuyer}
                style={styles.contactButton}
              />
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>Proof of payment</Text>
        <View style={styles.card}>
          {isLoadingProof ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : proofUrl ? (
            <AnimatedPressable onPress={() => setIsPreviewOpen(true)} scaleTo={0.98}>
              <Image source={{ uri: proofUrl }} style={styles.proofImage} contentFit="cover" />
              <View style={styles.expandHint}>
                <Ionicons name="expand-outline" size={13} color={colors.white} />
                <Text style={styles.expandHintText}>Tap to view</Text>
              </View>
            </AnimatedPressable>
          ) : (
            <Text style={styles.addressLine}>No proof of payment on file.</Text>
          )}
          {order.paymentVerified ? (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.golden} />
              <Text style={styles.verifiedText}>Payment verified</Text>
            </View>
          ) : (
            <Button
              label={isVerifying ? 'Verifying…' : 'Verify payment'}
              variant="secondary"
              disabled={isVerifying || !proofUrl}
              onPress={handleVerifyPayment}
              style={styles.verifyButton}
            />
          )}
        </View>

        {!terminal && (next || canRejectOrder(order.status)) && (
          <View style={styles.actionRow}>
            {canRejectOrder(order.status) && (
              <Button label="Reject" variant="ghost" disabled={isUpdating} onPress={handleReject} style={styles.actionButton} />
            )}
            {next && order.paymentVerified && (
              <Button
                label={isUpdating ? 'Updating…' : `Mark as ${orderStatusLabel(next, hasPhysicalItems)}`}
                variant="secondary"
                disabled={isUpdating}
                onPress={handleAdvance}
                style={styles.actionButton}
              />
            )}
          </View>
        )}
        {!terminal && next && !order.paymentVerified && (
          <Text style={styles.verifyHint}>Verify the payment proof above before you can advance this order.</Text>
        )}

        <Text style={styles.sectionLabel}>Your items in this order</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View
              key={`${item.listingId}-${index}`}
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
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Your total</Text>
            <Text style={styles.totalValue}>{formatPrice(itemsTotal)}</Text>
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

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.card}>
          <Text style={styles.addressLine}>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</Text>
        </View>
      </ScrollView>

      <ImagePreviewModal visible={isPreviewOpen} uri={proofUrl} onClose={() => setIsPreviewOpen(false)} />
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
  statusLabel: {
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
  contactButton: {
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  verifyHint: {
    ...t.caption,
    color: colors.terracotta,
    marginTop: spacing.sm,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
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
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  verifiedText: {
    ...t.bodyMedium,
    color: colors.golden,
  },
  verifyButton: {
    marginTop: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../../components/ui';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { ProductTypeTag } from '../../components/ProductTypeTag';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { isTerminalStatus, orderHasPhysicalItems, orderStatusColor, orderStatusLabel } from '../../lib/order-status';
import { getSignedUrl } from '../../lib/upload';
import { useOrderStore } from '../../store/order-store';

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!order) fetchOrders();
  }, [order, fetchOrders]);

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

  const hasPhysicalItems = orderHasPhysicalItems(order.items);
  const terminal = isTerminalStatus(order.status);
  const badgeColor = orderStatusColor(order.status);

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
        </View>

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
                          <Text style={styles.downloadButtonLabel}>Download</Text>
                        </>
                      )}
                    </AnimatedPressable>
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
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.likhaYellow + '33',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  downloadButtonLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
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

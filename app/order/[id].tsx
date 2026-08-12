import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../../components/ui';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { orderStatusLabel } from '../../lib/order-status';
import { useListingStore } from '../../store/listing-store';
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
  const listingsById = useListingStore((s) => s.listingsById);
  const fetchListingById = useListingStore((s) => s.fetchById);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!order) fetchOrders();
  }, [order, fetchOrders]);

  useEffect(() => {
    order?.items.forEach((item) => {
      if (item.listingId) fetchListingById(item.listingId);
    });
  }, [order, fetchListingById]);

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

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Order #${order.id.slice(-6)}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderDate}>Placed {new Date(order.createdAt).toLocaleString()}</Text>

        <View style={styles.card}>
          <OrderStatusTimeline status={order.status} />
          <Text style={styles.statusText}>Status: {orderStatusLabel(order.status)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => {
            const isDigital = listingsById[item.listingId]?.productType === 'digital';
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
                  {isDigital && (
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

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.card}>
          <Text style={styles.addressLine}>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</Text>
        </View>
      </ScrollView>
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
  statusText: {
    ...t.bodyMedium,
    color: colors.ink,
    marginTop: spacing.md,
    textAlign: 'center',
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
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

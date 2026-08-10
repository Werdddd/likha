import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { getOrderStatus, orderStatusLabel } from '../../lib/order-status';
import { useOrderStore } from '../../store/order-store';

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  gcash: 'GCash',
  card: 'Card',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id));

  if (!order) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Order' }} />
        <Text style={styles.body}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const status = getOrderStatus(order.createdAt);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Order #${order.id.slice(-6)}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderDate}>Placed {new Date(order.createdAt).toLocaleString()}</Text>

        <View style={styles.card}>
          <OrderStatusTimeline status={status} />
          <Text style={styles.statusText}>Status: {orderStatusLabel(status)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={item.listingId} style={[styles.itemRow, index < order.items.length - 1 && styles.itemDivider]}>
              <Image source={{ uri: item.coverUrl }} style={styles.itemThumb} contentFit="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
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

        <Text style={styles.sectionLabel}>Shipping address</Text>
        <View style={styles.card}>
          <Text style={styles.addressName}>{order.address.fullName}</Text>
          <Text style={styles.addressLine}>{order.address.phone}</Text>
          <Text style={styles.addressLine}>
            {order.address.line1}, {order.address.city}, {order.address.region} {order.address.postalCode}
          </Text>
        </View>

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

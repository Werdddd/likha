import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { getOrderStatus, orderStatusLabel } from '../lib/order-status';
import { useOrderStore } from '../store/order-store';

export default function OrdersScreen() {
  const orders = useOrderStore((s) => s.orders);
  const sorted = [...orders].reverse();

  if (sorted.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'My Orders' }} />
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyBody}>Orders you place will show up here so you can track them.</Text>
          <Button label="Browse Shop" onPress={() => router.replace('/(tabs)/shop')} style={styles.emptyButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'My Orders' }} />
      <View style={styles.list}>
        {sorted.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const status = getOrderStatus(order.createdAt);
          return (
            <AnimatedPressable
              key={order.id}
              style={styles.card}
              onPress={() => router.push(`/order/${order.id}`)}
              scaleTo={0.98}
            >
              <View style={styles.cardTop}>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusLabel}>{orderStatusLabel(status)}</Text>
                </View>
              </View>
              <Text style={styles.orderMeta}>
                {itemCount} item{itemCount === 1 ? '' : 's'} · {formatPrice(order.total)}
              </Text>
              <Text style={styles.itemPreview} numberOfLines={1}>
                {order.items.map((item) => item.title).join(', ')}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    ...t.label,
    color: colors.ink,
  },
  statusBadge: {
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  orderMeta: {
    ...t.bodyMedium,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  itemPreview: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

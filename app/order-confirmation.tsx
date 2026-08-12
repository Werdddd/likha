import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { useOrderStore } from '../store/order-store';

export default function OrderConfirmationScreen() {
  const order = useOrderStore((s) => s.orders[0]);
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={36} color={colors.ink} />
        </View>
        <Text style={styles.title}>Order placed!</Text>
        <Text style={styles.body}>
          {order
            ? `Your order of ${itemCount} item${itemCount === 1 ? '' : 's'} totaling ${formatPrice(order.total)} is on its way.`
            : 'Your order is on its way.'}
        </Text>

        {order && (
          <Button
            label="Track Order"
            variant="secondary"
            onPress={() => router.replace(`/order/${order.id}`)}
            style={styles.button}
          />
        )}
        <Button label="Back to Shop" onPress={() => router.replace('/(tabs)/shop')} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});

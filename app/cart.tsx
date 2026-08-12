import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartLineItem } from '../components/CartLineItem';
import { Button } from '../components/ui';
import { colors, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { useCartStore } from '../store/cart-store';
import { useCreatorStore } from '../store/creator-store';
import { useListingStore } from '../store/listing-store';
import type { Listing } from '../types';

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const listingsById = useListingStore((s) => s.listingsById);
  const getCreator = useCreatorStore((s) => s.getCreator);

  const lines = items
    .map((item) => ({ item, listing: listingsById[item.listingId] }))
    .filter((line): line is { item: (typeof items)[number]; listing: Listing } => !!line.listing);

  const subtotal = lines.reduce((sum, { item, listing }) => sum + listing.price * item.quantity, 0);

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Cart' }} />
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>Browse the shop to find something to add.</Text>
          <Button label="Browse Shop" onPress={() => router.replace('/(tabs)/shop')} style={styles.emptyButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Cart' }} />

      <View style={styles.list}>
        {lines.map(({ item, listing }) => (
          <CartLineItem
            key={item.listingId}
            listing={listing}
            creator={getCreator(listing.creatorId)}
            quantity={item.quantity}
            onChangeQuantity={(quantity) => setQuantity(item.listingId, quantity)}
            onRemove={() => removeItem(item.listingId)}
            onPress={() => router.push(`/listing/${listing.id}`)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Button label="Checkout" onPress={() => router.push('/checkout')} />
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
    flex: 1,
    padding: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subtotalLabel: {
    ...t.body,
    color: colors.warmBrown,
  },
  subtotalValue: {
    ...t.h3,
    color: colors.ink,
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

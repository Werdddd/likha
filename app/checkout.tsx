import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, SelectField, TextField } from '../components/ui';
import { regions } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { useCartStore } from '../store/cart-store';
import { useListingStore } from '../store/listing-store';
import { useOrderStore } from '../store/order-store';
import { useSessionStore } from '../store/session-store';
import type { Address, OrderItem, PaymentMethod, Region } from '../types';

const SHIPPING_FEE = 80;

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'gcash', label: 'GCash' },
  { value: 'card', label: 'Card' },
];

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const placeOrder = useOrderStore((s) => s.placeOrder);
  const listingsById = useListingStore((s) => s.listingsById);
  const currentUserId = useSessionStore((s) => s.currentUser.id);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState<Region>(regions[0]);
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderItems: OrderItem[] = useMemo(
    () =>
      items
        .map((item) => {
          const listing = listingsById[item.listingId];
          if (!listing) return null;
          return {
            listingId: listing.id,
            title: listing.title,
            coverUrl: listing.coverUrl,
            price: listing.price,
            quantity: item.quantity,
          };
        })
        .filter((line): line is OrderItem => line !== null),
    [items, listingsById],
  );

  const requiresShipping = useMemo(
    () => items.some((item) => listingsById[item.listingId]?.productType === 'physical'),
    [items, listingsById],
  );

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = requiresShipping ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  const canSubmit =
    orderItems.length > 0 &&
    !isSubmitting &&
    (!requiresShipping ||
      (fullName.trim().length > 0 &&
        phone.trim().length > 0 &&
        line1.trim().length > 0 &&
        city.trim().length > 0 &&
        postalCode.trim().length > 0));

  const handlePlaceOrder = async () => {
    if (!canSubmit) return;

    const address: Address | null = requiresShipping
      ? {
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          city: city.trim(),
          region,
          postalCode: postalCode.trim(),
        }
      : null;

    setIsSubmitting(true);
    const { order, error } = await placeOrder(currentUserId, {
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      address,
      paymentMethod,
    });
    setIsSubmitting(false);

    if (!order) {
      Alert.alert('Could not place order', error ?? 'Please try again.');
      return;
    }
    clearCart();
    router.replace('/order-confirmation');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Checkout' }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {requiresShipping && (
          <>
            <Text style={styles.sectionLabel}>Shipping address</Text>
            <TextField label="Full name" placeholder="Juan Dela Cruz" value={fullName} onChangeText={setFullName} />
            <TextField label="Phone" placeholder="09XX XXX XXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextField label="Address" placeholder="House no., street, barangay" value={line1} onChangeText={setLine1} />
            <TextField label="City" placeholder="City" value={city} onChangeText={setCity} />
            <SelectField label="Region" value={region} options={regions} onChange={(v) => setRegion(v as Region)} />
            <TextField label="Postal code" placeholder="1000" keyboardType="numeric" value={postalCode} onChangeText={setPostalCode} />
          </>
        )}

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.chipWrap}>
          {PAYMENT_METHODS.map((method) => (
            <Chip
              key={method.value}
              label={method.label}
              selected={paymentMethod === method.value}
              onPress={() => setPaymentMethod(method.value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.summaryCard}>
          {orderItems.map((item) => (
            <View key={item.listingId} style={styles.summaryRow}>
              <Text style={styles.summaryItemLabel} numberOfLines={1}>
                {item.title} × {item.quantity}
              </Text>
              <Text style={styles.summaryItemValue}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          {requiresShipping && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{formatPrice(shippingFee)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        <Button label="Place Order" disabled={!canSubmit} onPress={handlePlaceOrder} style={styles.submit} />
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
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCard: {
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  summaryItemLabel: {
    ...t.body,
    color: colors.ink,
    flex: 1,
  },
  summaryItemValue: {
    ...t.body,
    color: colors.ink,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
    marginVertical: spacing.xs,
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
  submit: {
    marginTop: spacing.lg,
  },
});

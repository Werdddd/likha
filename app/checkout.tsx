import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button, Chip, SelectField, TextField } from '../components/ui';
import { regions } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { pickAndUploadPrivateImage } from '../lib/upload';
import { useCartStore } from '../store/cart-store';
import { useListingStore } from '../store/listing-store';
import { useOrderStore } from '../store/order-store';
import { useSessionStore } from '../store/session-store';
import type { Address, OrderItem, PaymentMethod, Region } from '../types';

const SHIPPING_FEE = 80;

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [paymentProof, setPaymentProof] = useState<{ path: string; previewUri: string } | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
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
            productType: listing.productType,
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
    paymentProof !== null &&
    !isSubmitting &&
    (!requiresShipping ||
      (fullName.trim().length > 0 &&
        phone.trim().length > 0 &&
        line1.trim().length > 0 &&
        city.trim().length > 0 &&
        postalCode.trim().length > 0));

  const handlePickProof = async () => {
    setIsUploadingProof(true);
    const result = await pickAndUploadPrivateImage('payment-proofs', currentUserId, 'proof');
    setIsUploadingProof(false);
    if (result) setPaymentProof(result);
  };

  const handlePlaceOrder = async () => {
    if (!canSubmit || !paymentProof) return;

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
      paymentProofPath: paymentProof.path,
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

        <Text style={styles.sectionLabel}>Proof of payment</Text>
        <Text style={styles.proofHint}>
          Send payment via {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label} first, then upload a
          screenshot or photo of your receipt. The seller will verify it before fulfilling your order.
        </Text>
        {paymentProof ? (
          <View style={styles.proofPreviewWrap}>
            <Image source={{ uri: paymentProof.previewUri }} style={styles.proofPreview} contentFit="cover" />
            <AnimatedPressable
              style={styles.removeProofButton}
              scaleTo={0.9}
              onPress={() => setPaymentProof(null)}
              hitSlop={6}
            >
              <Ionicons name="close" size={13} color={colors.white} />
            </AnimatedPressable>
          </View>
        ) : (
          <AnimatedPressable
            style={styles.proofPicker}
            scaleTo={0.98}
            onPress={handlePickProof}
            disabled={isUploadingProof}
          >
            {isUploadingProof ? (
              <ActivityIndicator size="small" color={colors.warmBrown} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.warmBrown} />
                <Text style={styles.proofPickerLabel}>Upload proof of payment</Text>
              </>
            )}
          </AnimatedPressable>
        )}

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
  proofHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  proofPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  proofPickerLabel: {
    ...t.bodyMedium,
    color: colors.warmBrown,
  },
  proofPreviewWrap: {
    width: 96,
    height: 96,
  },
  proofPreview: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  removeProofButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
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

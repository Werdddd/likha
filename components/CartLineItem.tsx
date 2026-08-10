import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import type { Creator, Listing } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { QuantityStepper } from './ui/QuantityStepper';

interface CartLineItemProps {
  listing: Listing;
  creator?: Creator;
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
  onPress?: () => void;
}

export function CartLineItem({ listing, creator, quantity, onChangeQuantity, onRemove, onPress }: CartLineItemProps) {
  return (
    <View style={styles.card}>
      <AnimatedPressable onPress={onPress} style={styles.pressableRow} scaleTo={0.99}>
        <Image source={{ uri: listing.coverUrl }} style={styles.thumb} contentFit="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>
          {creator && (
            <Text style={styles.creator} numberOfLines={1}>
              {creator.name}
            </Text>
          )}
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
      </AnimatedPressable>

      <View style={styles.actions}>
        <QuantityStepper quantity={quantity} onChange={onChangeQuantity} />
        <AnimatedPressable onPress={onRemove} scaleTo={0.9} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.warmBrown} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  pressableRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creator: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  price: {
    ...t.label,
    color: colors.ink,
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
});

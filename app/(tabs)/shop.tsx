import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { ListingGrid } from '../../components/ListingGrid';
import { AnimatedPressable } from '../../components/ui';
import { disciplines, getCreatorById, listings } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useCartStore } from '../../store/cart-store';
import type { Discipline } from '../../types';

export default function ShopScreen() {
  const [category, setCategory] = useState<Discipline | null>(null);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const filteredListings = useMemo(
    () => (category ? listings.filter((l) => l.category === category) : listings),
    [category],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.headerActions}>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/search')} scaleTo={0.92}>
            <Ionicons name="search" size={20} color={colors.ink} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/cart')} scaleTo={0.92}>
            <Ionicons name="bag-outline" size={20} color={colors.ink} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeLabel}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.filterBar}>
        <FilterBar
          options={disciplines}
          selected={category}
          onSelect={(value) => setCategory(value as Discipline | null)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.gridWrap}>
          <ListingGrid
            listings={filteredListings}
            getCreator={getCreatorById}
            onPressListing={(listing) => router.push(`/listing/${listing.id}`)}
            emptyLabel="No listings in this category yet."
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  cartBadgeLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.white,
  },
  filterBar: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
  gridWrap: {
    paddingHorizontal: spacing.sm,
  },
});

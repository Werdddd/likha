import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { ListingGrid } from '../../components/ListingGrid';
import { AnimatedPressable, Chip } from '../../components/ui';
import { digitalCategories, getCreatorById, listings, physicalCategories } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useCartStore } from '../../store/cart-store';
import type { ProductCategory, ProductType } from '../../types';

const PRODUCT_TYPE_FILTERS: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
];

export default function ShopScreen() {
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const categoryOptions =
    productType === 'digital' ? digitalCategories : productType === 'physical' ? physicalCategories : [...digitalCategories, ...physicalCategories];

  const handleSelectProductType = (value: ProductType | null) => {
    setProductType(value);
    const options = value === 'digital' ? digitalCategories : value === 'physical' ? physicalCategories : null;
    if (options && category && !(options as ProductCategory[]).includes(category)) {
      setCategory(null);
    }
  };

  const filteredListings = useMemo(
    () =>
      listings.filter(
        (l) => (!productType || l.productType === productType) && (!category || l.category === category),
      ),
    [productType, category],
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

      <View style={styles.typeRow}>
        <Chip label="All" selected={productType === null} onPress={() => handleSelectProductType(null)} />
        {PRODUCT_TYPE_FILTERS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={productType === option.value}
            onPress={() => handleSelectProductType(productType === option.value ? null : option.value)}
          />
        ))}
      </View>

      <View style={styles.filterBar}>
        <FilterBar
          options={categoryOptions}
          selected={category}
          onSelect={(value) => setCategory(value as ProductCategory | null)}
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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

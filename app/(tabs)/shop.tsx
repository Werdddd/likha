import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { ListingGrid } from '../../components/ListingGrid';
import { ProductTypeFilterSheet } from '../../components/ProductTypeFilterSheet';
import { AnimatedPressable, TextField } from '../../components/ui';
import { digitalCategories, physicalCategories } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useCartStore } from '../../store/cart-store';
import { useCreatorStore } from '../../store/creator-store';
import { useListingStore } from '../../store/listing-store';
import type { ProductCategory, ProductType } from '../../types';

const PRODUCT_TYPE_FILTERS: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
];

export default function ShopScreen() {
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [query, setQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const listingsById = useListingStore((s) => s.listingsById);
  const fetchFeed = useListingStore((s) => s.fetchFeed);
  const getCreator = useCreatorStore((s) => s.getCreator);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const listings = useMemo(
    () => Object.values(listingsById).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [listingsById],
  );

  const normalizedQuery = query.trim().toLowerCase();

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
      listings.filter((l) => {
        const matchesType = !productType || l.productType === productType;
        const matchesCategory = !category || l.category === category;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          l.title.toLowerCase().includes(normalizedQuery) ||
          l.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
        return matchesType && matchesCategory && matchesQuery;
      }),
    [listings, productType, category, normalizedQuery],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.headerActions}>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/orders')} scaleTo={0.92}>
            <Ionicons name="receipt-outline" size={20} color={colors.ink} />
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

      <View style={styles.searchRow}>
        <TextField
          label=""
          placeholder="Search listings, tags..."
          value={query}
          onChangeText={setQuery}
          leadingIcon="search"
          containerStyle={styles.searchField}
        />
        <AnimatedPressable style={styles.filterButton} onPress={() => setFilterSheetOpen(true)} scaleTo={0.92}>
          <Ionicons name="options-outline" size={20} color={colors.ink} />
          {productType !== null && <View style={styles.filterDot} />}
        </AnimatedPressable>
      </View>

      <View style={styles.filterBar}>
        <FilterBar
          options={categoryOptions}
          selected={category}
          onSelect={(value) => setCategory(value as ProductCategory | null)}
        />
      </View>

      <ProductTypeFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        options={PRODUCT_TYPE_FILTERS}
        value={productType}
        onSelect={handleSelectProductType}
      />

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.gridWrap}>
          <ListingGrid
            listings={filteredListings}
            getCreator={getCreator}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGray + '4d',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    borderWidth: 1.5,
    borderColor: colors.canvas,
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

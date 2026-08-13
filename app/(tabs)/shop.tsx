import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { ListingGrid } from '../../components/ListingGrid';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { ProductTypeFilterSheet } from '../../components/ProductTypeFilterSheet';
import { ProductTypeTag } from '../../components/ProductTypeTag';
import { AnimatedPressable, Button, SegmentedControl, TabRow, TextField } from '../../components/ui';
import { digitalCategories, physicalCategories } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import {
  canRejectOrder,
  isTerminalStatus,
  nextOrderStatus,
  orderHasPhysicalItems,
  orderStatusColor,
  orderStatusLabel,
} from '../../lib/order-status';
import { useCartStore } from '../../store/cart-store';
import { useCreatorStore } from '../../store/creator-store';
import { useDashboardStore } from '../../store/dashboard-store';
import { useListingStore } from '../../store/listing-store';
import { useSessionStore } from '../../store/session-store';
import type { CreatorOrder, Listing, ProductCategory, ProductType } from '../../types';

const PRODUCT_TYPE_FILTERS: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
];

type ShopMode = 'browse' | 'my-shop';
type DashboardTab = 'listings' | 'analytics' | 'orders';

const SHOP_MODE_OPTIONS: Array<{ value: ShopMode; label: string }> = [
  { value: 'browse', label: 'Browse' },
  { value: 'my-shop', label: 'My Shop' },
];

const DASHBOARD_TAB_OPTIONS: Array<{ value: DashboardTab; label: string }> = [
  { value: 'listings', label: 'Listings' },
  { value: 'orders', label: 'Orders' },
  { value: 'analytics', label: 'Analytics' },
];

export default function ShopScreen() {
  const [mode, setMode] = useState<ShopMode>('browse');

  // Browse (buyer) state
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [query, setQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [browseRefreshing, setBrowseRefreshing] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const listingsById = useListingStore((s) => s.listingsById);
  const fetchFeed = useListingStore((s) => s.fetchFeed);
  const getCreator = useCreatorStore((s) => s.getCreator);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefreshBrowse = useCallback(async () => {
    setBrowseRefreshing(true);
    await fetchFeed();
    setBrowseRefreshing(false);
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

  // My Shop (seller/creator) state
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('listings');
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const orders = useDashboardStore((s) => s.orders);
  const stats = useDashboardStore((s) => s.stats);
  const isDashboardLoading = useDashboardStore((s) => s.isLoading);
  const fetchDashboard = useDashboardStore((s) => s.fetchDashboard);
  const updateOrderStatus = useDashboardStore((s) => s.updateOrderStatus);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchMyListings = useListingStore((s) => s.fetchMyListings);
  const setListingActive = useListingStore((s) => s.setListingActive);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);
  const myListings = useMemo(
    () =>
      Object.values(listingsById)
        .filter((l) => l.creatorId === currentUserId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [listingsById, currentUserId],
  );

  useEffect(() => {
    if (mode === 'my-shop' && currentUserId) fetchDashboard(currentUserId);
  }, [mode, currentUserId, fetchDashboard]);

  useEffect(() => {
    if (mode !== 'my-shop' || dashboardTab !== 'listings' || !currentUserId) return;
    setIsLoadingListings(true);
    fetchMyListings(currentUserId).finally(() => setIsLoadingListings(false));
  }, [mode, dashboardTab, currentUserId, fetchMyListings]);

  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const onRefreshDashboard = useCallback(async () => {
    if (!currentUserId) return;
    setDashboardRefreshing(true);
    if (dashboardTab === 'listings') {
      await fetchMyListings(currentUserId);
    } else {
      await fetchDashboard(currentUserId);
    }
    setDashboardRefreshing(false);
  }, [currentUserId, dashboardTab, fetchMyListings, fetchDashboard]);

  const handleToggleListingActive = async (listing: Listing) => {
    setUpdatingListingId(listing.id);
    const { error } = await setListingActive(listing.id, !listing.isActive);
    setUpdatingListingId(null);
    if (error) Alert.alert('Could not update listing', error);
  };

  const handleAdvanceStatus = async (order: CreatorOrder) => {
    const next = nextOrderStatus(order.status, orderHasPhysicalItems(order.items));
    if (!next) return;
    setUpdatingOrderId(order.id);
    const { error } = await updateOrderStatus(order.id, next);
    setUpdatingOrderId(null);
    if (error) Alert.alert('Could not update order', error);
  };

  const handleRejectOrder = (order: CreatorOrder) => {
    Alert.alert('Reject this order?', 'The buyer will see this order as rejected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setUpdatingOrderId(order.id);
          const { error } = await updateOrderStatus(order.id, 'rejected');
          setUpdatingOrderId(null);
          if (error) Alert.alert('Could not reject order', error);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        {mode === 'browse' && (
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
        )}
      </View>

      <View style={styles.modeRow}>
        <SegmentedControl options={SHOP_MODE_OPTIONS} value={mode} onChange={setMode} />
      </View>

      {mode === 'browse' ? (
        <>
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

          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={browseRefreshing} onRefresh={onRefreshBrowse} tintColor={colors.ink} />
            }
          >
            <View style={styles.gridWrap}>
              <ListingGrid
                listings={filteredListings}
                getCreator={getCreator}
                onPressListing={(listing) => router.push(`/listing/${listing.id}`)}
                emptyLabel="No listings in this category yet."
              />
            </View>
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.dashboardTabRow}>
            <TabRow options={DASHBOARD_TAB_OPTIONS} value={dashboardTab} onChange={setDashboardTab} />
          </View>

          {dashboardTab === 'listings' ? (
            <ListingsTab
              listings={myListings}
              isLoading={isLoadingListings}
              updatingListingId={updatingListingId}
              onToggleActive={handleToggleListingActive}
              refreshing={dashboardRefreshing}
              onRefresh={onRefreshDashboard}
            />
          ) : isDashboardLoading && !stats ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : dashboardTab === 'analytics' ? (
            <AnalyticsTab stats={stats} refreshing={dashboardRefreshing} onRefresh={onRefreshDashboard} />
          ) : (
            <OrdersTab
              orders={orders}
              updatingOrderId={updatingOrderId}
              onAdvanceStatus={handleAdvanceStatus}
              onRejectOrder={handleRejectOrder}
              refreshing={dashboardRefreshing}
              onRefresh={onRefreshDashboard}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function AnalyticsTab({
  stats,
  refreshing,
  onRefresh,
}: {
  stats: ReturnType<typeof useDashboardStore.getState>['stats'];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (!stats || stats.ordersCount === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Ionicons name="stats-chart-outline" size={40} color={colors.softGray} />
        <Text style={styles.emptyTitle}>No sales yet</Text>
        <Text style={styles.emptyBody}>
          Once buyers order your listings, your revenue and top sellers will show up here.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.dashboardContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
      <View style={styles.statsGrid}>
        <StatTile icon="cash-outline" label="Confirmed revenue" value={formatPrice(stats.revenue)} />
        <StatTile icon="time-outline" label="Pending verification" value={formatPrice(stats.pendingRevenue)} />
        <StatTile icon="receipt-outline" label="Orders" value={stats.ordersCount.toLocaleString()} />
        <StatTile icon="cube-outline" label="Items sold" value={stats.itemsSold.toLocaleString()} />
        <StatTile icon="pricetags-outline" label="Listings" value={stats.listingsCount.toLocaleString()} />
      </View>
      {stats.pendingRevenue > 0 && (
        <Text style={styles.pendingHint}>
          Pending revenue is from orders whose payment you haven't verified yet — review them in Orders.
        </Text>
      )}

      <Text style={styles.sectionLabel}>Top listings</Text>
      <View style={styles.card}>
        {stats.topListings.map((listing, index) => (
          <View
            key={listing.listingId || listing.title}
            style={[styles.topListingRow, index < stats.topListings.length - 1 && styles.itemDivider]}
          >
            <Image source={{ uri: listing.coverUrl }} style={styles.topListingThumb} contentFit="cover" />
            <View style={styles.topListingInfo}>
              <Text style={styles.topListingTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.topListingMeta}>
                {listing.unitsSold} sold · {formatPrice(listing.revenue)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={colors.golden} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrdersTab({
  orders,
  updatingOrderId,
  onAdvanceStatus,
  onRejectOrder,
  refreshing,
  onRefresh,
}: {
  orders: CreatorOrder[];
  updatingOrderId: string | null;
  onAdvanceStatus: (order: CreatorOrder) => void;
  onRejectOrder: (order: CreatorOrder) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (orders.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Ionicons name="receipt-outline" size={40} color={colors.softGray} />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyBody}>Orders containing your listings will show up here to fulfill.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.dashboardContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
      {orders.map((order) => {
        const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const hasPhysicalItems = orderHasPhysicalItems(order.items);
        const next = nextOrderStatus(order.status, hasPhysicalItems);
        const terminal = isTerminalStatus(order.status);
        const badgeColor = orderStatusColor(order.status);
        const isUpdating = updatingOrderId === order.id;

        return (
          <AnimatedPressable
            key={order.id}
            style={styles.card}
            scaleTo={0.98}
            onPress={() => router.push(`/creator-order/${order.id}`)}
          >
            <View style={styles.orderTop}>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: badgeColor.bg }]}>
                <Text style={[styles.statusBadgeLabel, { color: badgeColor.fg }]}>
                  {orderStatusLabel(order.status, hasPhysicalItems)}
                </Text>
              </View>
            </View>

            {order.address && (
              <Text style={styles.customerName}>
                {order.address.fullName} · {order.address.city}
              </Text>
            )}

            {order.items.map((item, index) => (
              <View
                key={`${item.listingId}-${index}`}
                style={[styles.itemRow, index < order.items.length - 1 && styles.itemDivider]}
              >
                <Image source={{ uri: item.coverUrl }} style={styles.itemThumb} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPrice(item.price)}
                  </Text>
                  <ProductTypeTag productType={item.productType} />
                </View>
              </View>
            ))}

            <View style={styles.orderFooter}>
              <Text style={styles.orderFooterText}>
                {itemCount} item{itemCount === 1 ? '' : 's'} · {formatPrice(itemsTotal)}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Ionicons
                name={order.paymentVerified ? 'checkmark-circle' : 'time-outline'}
                size={13}
                color={order.paymentVerified ? colors.golden : colors.warmBrown}
              />
              <Text style={[styles.paymentStatusText, order.paymentVerified && styles.paymentVerifiedText]}>
                {order.paymentVerified ? 'Payment verified' : 'Payment pending verification — tap to review'}
              </Text>
            </View>

            {terminal ? (
              <Text style={styles.terminalText}>
                {order.status === 'rejected' ? 'You rejected this order.' : 'This order was cancelled.'}
              </Text>
            ) : (
              <View style={styles.timelineWrap}>
                <OrderStatusTimeline status={order.status} hasPhysicalItems={hasPhysicalItems} />
              </View>
            )}

            {!terminal && (next || canRejectOrder(order.status)) && (
              <View style={styles.actionRow}>
                {canRejectOrder(order.status) && (
                  <Button
                    label="Reject"
                    variant="ghost"
                    disabled={isUpdating}
                    onPress={() => onRejectOrder(order)}
                    style={styles.actionButton}
                  />
                )}
                {next && order.paymentVerified && (
                  <Button
                    label={isUpdating ? 'Updating…' : `Mark as ${orderStatusLabel(next, hasPhysicalItems)}`}
                    variant="secondary"
                    disabled={isUpdating}
                    onPress={() => onAdvanceStatus(order)}
                    style={styles.actionButton}
                  />
                )}
              </View>
            )}
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

function ListingsTab({
  listings,
  isLoading,
  updatingListingId,
  onToggleActive,
  refreshing,
  onRefresh,
}: {
  listings: Listing[];
  isLoading: boolean;
  updatingListingId: string | null;
  onToggleActive: (listing: Listing) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (isLoading && listings.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Ionicons name="pricetags-outline" size={40} color={colors.softGray} />
        <Text style={styles.emptyTitle}>No listings yet</Text>
        <Text style={styles.emptyBody}>Publish your first product to start selling.</Text>
        <Button label="New Listing" onPress={() => router.push('/listing/new')} style={styles.emptyButton} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.dashboardContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
      <View style={styles.listingsHeaderRow}>
        <Text style={styles.sectionLabel}>
          {listings.length} listing{listings.length === 1 ? '' : 's'}
        </Text>
        <AnimatedPressable
          style={styles.newListingButton}
          onPress={() => router.push('/listing/new')}
          scaleTo={0.95}
        >
          <Ionicons name="add" size={16} color={colors.ink} />
          <Text style={styles.newListingButtonLabel}>New</Text>
        </AnimatedPressable>
      </View>

      {listings.map((listing) => (
        <AnimatedPressable
          key={listing.id}
          style={styles.card}
          scaleTo={0.98}
          onPress={() => router.push(`/listing/${listing.id}/edit`)}
        >
          <View style={styles.listingRow}>
            <Image source={{ uri: listing.coverUrl }} style={styles.itemThumb} contentFit="cover" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.itemMeta}>
                {formatPrice(listing.price)}
                {listing.productType === 'physical' && listing.stock !== null
                  ? ` · ${listing.stock} in stock`
                  : ''}
              </Text>
              <ProductTypeTag productType={listing.productType} />
            </View>
            <AnimatedPressable
              style={[styles.statusPill, listing.isActive ? styles.statusPillActive : styles.statusPillInactive]}
              scaleTo={0.92}
              disabled={updatingListingId === listing.id}
              onPress={() => onToggleActive(listing)}
            >
              <Text
                style={[
                  styles.statusPillLabel,
                  listing.isActive ? styles.statusPillLabelActive : styles.statusPillLabelInactive,
                ]}
              >
                {updatingListingId === listing.id ? '…' : listing.isActive ? 'Active' : 'Inactive'}
              </Text>
            </AnimatedPressable>
          </View>
        </AnimatedPressable>
      ))}
    </ScrollView>
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
  modeRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  dashboardTabRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...t.h3,
    color: colors.ink,
  },
  statLabel: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  pendingHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  topListingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  topListingThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  topListingInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  topListingTitle: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  topListingMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  orderTop: {
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
  statusBadgeLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  customerName: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.xs,
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
    width: 40,
    height: 40,
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
  orderFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  orderFooterText: {
    ...t.caption,
    color: colors.ink,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  paymentStatusText: {
    ...t.caption,
    color: colors.warmBrown,
  },
  paymentVerifiedText: {
    color: colors.golden,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  timelineWrap: {
    marginTop: spacing.md,
  },
  terminalText: {
    ...t.bodyMedium,
    color: colors.terracotta,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
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
  listingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  newListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.likhaYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  newListingButtonLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  statusPillActive: {
    backgroundColor: colors.likhaYellow + '33',
  },
  statusPillInactive: {
    backgroundColor: colors.softGray + '80',
  },
  statusPillLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  statusPillLabelActive: {
    color: colors.golden,
  },
  statusPillLabelInactive: {
    color: colors.warmBrown,
  },
});

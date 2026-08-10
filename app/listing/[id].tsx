import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, Avatar, Button, QuantityStepper } from '../../components/ui';
import { getCreatorById, getListingById, getProjectById } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { useCartStore } from '../../store/cart-store';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListingById(id);
  const creator = listing ? getCreatorById(listing.creatorId) : undefined;
  const linkedProject = listing?.projectId ? getProjectById(listing.projectId) : undefined;
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.96);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 320 });
    heroScale.value = withTiming(1, { duration: 320 });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Listing' }} />
        <Text style={styles.body}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  const soldOut = listing.stock === 0;

  const handleAddToCart = () => addItem(listing.id, quantity);
  const handleBuyNow = () => {
    addItem(listing.id, quantity);
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        <Animated.View style={heroStyle}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {listing.images.map((url, index) => (
              <Image key={url + index} source={{ uri: url }} style={{ width, height: width }} contentFit="cover" />
            ))}
          </ScrollView>

          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((url, index) => (
                <View key={url + index} style={[styles.dot, index === page && styles.dotActive]} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>

          {creator && (
            <Link href={`/creator/${creator.id}`} asChild>
              <AnimatedPressable style={styles.creatorRow} scaleTo={0.98}>
                <Avatar uri={creator.avatarUrl} size={36} bordered />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorMeta}>{creator.region}</Text>
                </View>
              </AnimatedPressable>
            </Link>
          )}

          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.tagRow}>
            <Text style={styles.tag}>{listing.category}</Text>
            {listing.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>

          <Text style={styles.stock}>
            {soldOut ? 'Sold out' : listing.stock === null ? 'Made to order' : `${listing.stock} in stock`}
          </Text>

          {linkedProject && (
            <Link href={`/project/${linkedProject.id}`} asChild>
              <AnimatedPressable style={styles.projectLink} scaleTo={0.98}>
                <Ionicons name="sparkles-outline" size={16} color={colors.ink} />
                <Text style={styles.projectLinkLabel}>From the project: {linkedProject.title}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.warmBrown} />
              </AnimatedPressable>
            </Link>
          )}

          {!soldOut && (
            <View style={styles.purchaseRow}>
              <Text style={styles.sectionLabel}>Quantity</Text>
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={listing.stock ?? 99} />
            </View>
          )}

          <View style={styles.actionsRow}>
            <Button
              label={soldOut ? 'Sold Out' : 'Add to Cart'}
              variant="secondary"
              disabled={soldOut}
              onPress={handleAddToCart}
              style={styles.actionButton}
            />
            <Button
              label="Buy Now"
              disabled={soldOut}
              onPress={handleBuyNow}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>

      <AnimatedPressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        scaleTo={0.9}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </AnimatedPressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white + '80',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  price: {
    ...t.h2,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.golden,
    marginTop: spacing.xs,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creatorMeta: {
    ...t.caption,
    color: colors.warmBrown,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tag: {
    ...t.caption,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stock: {
    ...t.label,
    color: colors.warmBrown,
    marginTop: spacing.md,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
  },
  projectLinkLabel: {
    ...t.caption,
    color: colors.ink,
    flex: 1,
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

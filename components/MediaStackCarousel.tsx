import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '../constants/theme';
import type { ProjectMedia } from '../types';

interface MediaStackCarouselProps {
  media: ProjectMedia[];
}

const ROTATION_DEG = 7;
const SIDE_SCALE = 0.93;
const SIDE_LIFT = 16;

export function MediaStackCarousel({ media }: MediaStackCarouselProps) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scrollX = useSharedValue(0);

  const cardWidth = width * 0.72;
  const cardHeight = cardWidth * 1.22;
  const sideOffset = width * 0.17;
  const containerHeight = cardHeight + SIDE_LIFT + spacing.lg;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <View style={[styles.container, { height: containerHeight }]}>
        <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
          <Image source={{ uri: media[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {media.map((item, index) => (
        <StackCard
          key={item.id}
          item={item}
          index={index}
          scrollX={scrollX}
          pageWidth={width}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          sideOffset={sideOffset}
        />
      ))}

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {media.map((item) => (
          <View key={item.id} style={{ width }} />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {media.map((item, index) => (
          <View key={item.id} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

interface StackCardProps {
  item: ProjectMedia;
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  cardWidth: number;
  cardHeight: number;
  sideOffset: number;
}

function StackCard({ item, index, scrollX, pageWidth, cardWidth, cardHeight, sideOffset }: StackCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = index - scrollX.value / pageWidth;
    const clamped = interpolate(distance, [-1, 0, 1], [-1, 0, 1], Extrapolation.CLAMP);
    const absClamped = Math.abs(clamped);

    const translateX = interpolate(clamped, [-1, 0, 1], [-sideOffset, 0, sideOffset]);
    const translateY = interpolate(absClamped, [0, 1], [0, -SIDE_LIFT]);
    const rotate = interpolate(clamped, [-1, 0, 1], [-ROTATION_DEG, 0, ROTATION_DEG]);
    const scale = interpolate(absClamped, [0, 1], [1, SIDE_SCALE]);
    const opacity = interpolate(Math.abs(distance), [0, 1, 1.6], [1, 1, 0], Extrapolation.CLAMP);
    const depth = interpolate(absClamped, [0, 1], [10, 1]);

    return {
      opacity,
      zIndex: Math.round(depth),
      elevation: depth,
      transform: [{ translateX }, { translateY }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.card,
        { width: cardWidth, height: cardHeight, position: 'absolute' },
        animatedStyle,
      ]}
    >
      <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.softGray,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  dots: {
    position: 'absolute',
    bottom: 0,
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
    backgroundColor: colors.warmBrown + '40',
  },
  dotActive: {
    backgroundColor: colors.terracotta,
    width: 16,
  },
});

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useIntroStore } from '../../store/intro-store';

// Each slide can use its own avatar illustration once it exists — drop the file into
// /assets and swap the `require` below. Until then every slide reuses likha-avatar.png.
const slides = [
  {
    key: 'discover',
    avatar: require('../../assets/likha-avatar.png'), // TODO: swap for likha-avatar-discover.png — avatar browsing a feed of artwork thumbnails on her tablet, curious/delighted expression
    title: 'Discover creativity worth celebrating',
    description: 'Explore original art, designs, and craft from Filipino creators — curated and ready to inspire you.',
  },
  {
    key: 'share',
    avatar: require('../../assets/likha-avatar.png'), // avatar mid-sketch on her tablet — this is the default pose
    title: 'Share your craft, build your portfolio',
    description: 'Post your projects, grow a following, and turn your passion into a portfolio people notice.',
  },
  {
    key: 'work',
    avatar: require('../../assets/likha-avatar.png'), // TODO: swap for likha-avatar-hired.png — avatar giving a thumbs up or handshake beside a "Hired" clipboard or chat bubble
    title: 'Get discovered. Get hired.',
    description: 'Apply to job posts, offer commissions, and chat directly with clients who love your style.',
  },
  {
    key: 'shop',
    avatar: require('../../assets/likha-avatar.png'), // TODO: swap for likha-avatar-shop.png — avatar holding a wrapped parcel or shopping bag with a price tag, proud smile
    title: 'Open your own shop',
    description: 'Sell prints, merch, and original pieces directly to fans and collectors — all in one place.',
  },
];

export default function IntroScreen() {
  const { width } = useWindowDimensions();
  const markIntroSeen = useIntroStore((s) => s.markIntroSeen);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const isLastSlide = page === slides.length - 1;

  const finish = () => {
    markIntroSeen();
    router.replace('/(auth)/welcome');
  };

  const goNext = () => {
    if (isLastSlide) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        {!isLastSlide && (
          <AnimatedPressable onPress={finish} scaleTo={0.95}>
            <Text style={styles.skip}>Skip</Text>
          </AnimatedPressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.heroWrap}>
              <Image source={slide.avatar} style={styles.heroImage} contentFit="contain" />
            </View>
            <Animated.View entering={FadeIn.duration(300)} key={`${slide.key}-copy`}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View key={slide.key} style={[styles.dot, index === page && styles.dotActive]} />
          ))}
        </View>

        <Button label={isLastSlide ? 'Get Started' : 'Next'} onPress={goNext} style={styles.nextButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    height: 40,
  },
  skip: {
    ...t.bodyMedium,
    color: colors.golden,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  heroWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...t.h1,
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.warmBrown + '40',
  },
  dotActive: {
    backgroundColor: colors.likhaYellow,
    width: 20,
  },
  nextButton: {
    width: '100%',
  },
});

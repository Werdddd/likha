import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../../constants/theme';

const HOLD_MS = 3500;
const EXIT_DURATION = 450;
const LOGO_Y_OFFSET = -20; // negative moves logo up, positive moves it down

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);

  const goToWelcome = () => {
    router.replace('/(auth)/welcome');
  };

  const reveal = () => {
    opacity.value = withTiming(
      0,
      { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(goToWelcome)();
      },
    );
  };

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.2)) });

    const timer = setTimeout(reveal, HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Pressable style={styles.pressable} onPress={reveal}>
      <Animated.View style={[styles.screen, screenStyle]}>
        <Image
          source={require('../../assets/splash-bg.png')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <View style={[StyleSheet.absoluteFillObject, styles.tint]} />
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[styles.content, logoStyle]}>
            <Image
              source={require('../../assets/likha-whitelogo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.likhaYellow,
  },
  tint: {
    backgroundColor: colors.likhaYellow,
    opacity: 0.5,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: 600,
    height: 300,
    transform: [{ translateY: LOGO_Y_OFFSET }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});

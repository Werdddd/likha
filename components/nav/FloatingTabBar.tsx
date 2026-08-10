import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from '../ui/AnimatedPressable';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  discover: { active: 'home', inactive: 'home-outline', label: 'Home' },
  shop: { active: 'bag', inactive: 'bag-outline', label: 'Shop' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

interface FloatingTabBarProps extends BottomTabBarProps {
  onCreatePress: () => void;
}

export function FloatingTabBar({ state, navigation, onCreatePress }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  const renderTab = (route: (typeof state.routes)[number]) => {
    const index = state.routes.indexOf(route);
    const isFocused = state.index === index;
    const icon = TAB_ICONS[route.name];
    if (!icon) return null;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <AnimatedPressable key={route.key} onPress={onPress} style={styles.tabItem} scaleTo={0.88}>
        <Ionicons
          name={isFocused ? icon.active : icon.inactive}
          size={21}
          color={isFocused ? colors.likhaYellow : colors.warmBrown}
        />
        <Text style={[styles.tabLabel, { color: isFocused ? colors.likhaYellow : colors.warmBrown }]}>
          {icon.label}
        </Text>
      </AnimatedPressable>
    );
  };

  const blurMethod = Platform.OS === 'android' ? 'dimezisBlurView' : undefined;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <BlurView intensity={70} tint="light" experimentalBlurMethod={blurMethod} style={styles.barBlur} />
        <View style={styles.barTint} />
        <View style={styles.barContent}>{state.routes.map(renderTab)}</View>
      </View>

      <AnimatedPressable onPress={onCreatePress} style={styles.createButton} scaleTo={0.9}>
        <BlurView
          intensity={70}
          tint="light"
          experimentalBlurMethod={blurMethod}
          style={styles.createButtonBlur}
        />
        <View style={styles.createButtonTint} />
        <Ionicons name="add" size={26} color={colors.ink} />
      </AnimatedPressable>
    </View>
  );
}

const BAR_HEIGHT = 58;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: colors.white + 'CC',
    borderLeftColor: colors.white + 'CC',
    borderRightColor: colors.white + '40',
    borderBottomColor: colors.white + '40',
    ...shadow.lg,
  },
  barBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    backgroundColor: colors.white + '3D',
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  tabLabel: {
    ...t.caption,
    fontSize: 10,
  },
  createButton: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: colors.white + 'CC',
    borderLeftColor: colors.white + 'CC',
    borderRightColor: colors.white + '40',
    borderBottomColor: colors.white + '40',
    ...shadow.lg,
  },
  createButtonBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_HEIGHT / 2,
  },
  createButtonTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.likhaYellow + 'B3',
  },
});

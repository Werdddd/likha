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
  portfolio: { active: 'grid', inactive: 'grid-outline', label: 'Portfolio' },
  activity: { active: 'heart', inactive: 'heart-outline', label: 'Activity' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

interface FloatingTabBarProps extends BottomTabBarProps {
  onCreatePress: () => void;
}

export function FloatingTabBar({ state, navigation, onCreatePress }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const midpoint = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, midpoint);
  const rightRoutes = state.routes.slice(midpoint);

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
          size={22}
          color={isFocused ? colors.ink : colors.warmBrown}
        />
        <Text style={[styles.tabLabel, { color: isFocused ? colors.ink : colors.warmBrown }]}>{icon.label}</Text>
      </AnimatedPressable>
    );
  };

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
      <BlurView
        intensity={50}
        tint="light"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={styles.bar}
      >
        <View style={styles.barContent}>
          <View style={styles.side}>{leftRoutes.map(renderTab)}</View>
          <View style={styles.centerGap} />
          <View style={styles.side}>{rightRoutes.map(renderTab)}</View>
        </View>
      </BlurView>

      <AnimatedPressable onPress={onCreatePress} style={styles.createButton} scaleTo={0.9}>
        <Ionicons name="add" size={28} color={colors.ink} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.white + '80',
    backgroundColor: colors.canvas + 'B3',
    ...shadow.md,
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  centerGap: {
    width: 56,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabLabel: {
    ...t.caption,
    fontSize: 10,
  },
  createButton: {
    position: 'absolute',
    top: -22,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.canvas,
    ...shadow.lg,
  },
});

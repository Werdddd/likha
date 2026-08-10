import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from '../ui/AnimatedPressable';

interface CreateSheetProps {
  visible: boolean;
  onClose: () => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

interface Tile {
  key: string;
  label: string;
  icon: IconName;
  disabled?: boolean;
  onPress?: () => void;
}

const SHEET_HEIGHT = 320;

export function CreateSheet({ visible, onClose }: CreateSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(0.45, { duration: 280 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 220 });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const go = (href: Parameters<typeof router.push>[0]) => {
    onClose();
    router.push(href);
  };

  const tiles: Tile[] = [
    { key: 'project', label: 'Post a Project', icon: 'sparkles-outline', onPress: () => go('/project/new') },
    { key: 'wip', label: 'Share a WIP', icon: 'ellipse-outline', onPress: () => go('/project/new?kind=wip') },
    { key: 'product', label: 'Add a Product', icon: 'bag-outline', onPress: () => go('/listing/new') },
    { key: 'commission', label: 'Open for Commissions', icon: 'create-outline', disabled: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }, panelStyle]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>What do you want to share?</Text>

        <View style={styles.grid}>
          {tiles.map((tile) => (
            <AnimatedPressable
              key={tile.key}
              disabled={tile.disabled}
              onPress={tile.onPress}
              scaleTo={0.96}
              style={[styles.tile, tile.disabled && styles.tileDisabled]}
            >
              <View style={[styles.tileIcon, tile.disabled && styles.tileIconDisabled]}>
                <Ionicons name={tile.icon} size={22} color={tile.disabled ? colors.warmBrown : colors.ink} />
              </View>
              <Text style={[styles.tileLabel, tile.disabled && styles.tileLabelDisabled]}>{tile.label}</Text>
              {tile.disabled && <Text style={styles.comingSoon}>Coming soon</Text>}
            </AnimatedPressable>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...t.h2,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  tileDisabled: {
    backgroundColor: colors.softGray + '4d',
    shadowOpacity: 0,
    elevation: 0,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileIconDisabled: {
    backgroundColor: colors.softGray,
  },
  tileLabel: {
    ...t.bodyMedium,
    color: colors.ink,
    textAlign: 'center',
  },
  tileLabelDisabled: {
    color: colors.warmBrown,
  },
  comingSoon: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
});

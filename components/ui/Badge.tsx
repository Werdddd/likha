import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, type as t } from '../../constants/theme';

export type BadgeTone = 'neutral' | 'active' | 'positive' | 'muted';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  return (
    <Text style={[styles.base, toneStyles[tone], style]} numberOfLines={1}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: colors.softGray + '80',
    color: colors.ink,
  },
  active: {
    backgroundColor: colors.likhaYellow + '3d',
    color: colors.warmBrown,
  },
  positive: {
    backgroundColor: colors.ink,
    color: colors.canvas,
  },
  muted: {
    backgroundColor: colors.softGray + '4d',
    color: colors.warmBrown,
    opacity: 0.8,
  },
});

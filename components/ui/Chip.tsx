import { StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.95}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '80',
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.ink,
  },
  label: {
    ...t.label,
    color: colors.warmBrown,
  },
  labelSelected: {
    color: colors.canvas,
  },
});

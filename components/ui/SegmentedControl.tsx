import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <AnimatedPressable
            key={option.value}
            style={[styles.segment, selected && styles.segmentSelected]}
            scaleTo={0.97}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  label: {
    ...t.label,
    color: colors.warmBrown,
  },
  labelSelected: {
    color: colors.ink,
  },
});

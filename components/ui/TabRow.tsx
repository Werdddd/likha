import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface TabRowOption<T extends string> {
  value: T;
  label: string;
}

interface TabRowProps<T extends string> {
  options: TabRowOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabRow<T extends string>({ options, value, onChange }: TabRowProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <AnimatedPressable
            key={option.value}
            style={styles.tab}
            scaleTo={0.97}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
            <View style={[styles.underline, selected && styles.underlineSelected]} />
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  label: {
    ...t.label,
    color: colors.warmBrown,
  },
  labelSelected: {
    color: colors.ink,
  },
  underline: {
    height: 2,
    width: '50%',
    marginTop: spacing.xs,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineSelected: {
    backgroundColor: colors.likhaYellow,
  },
});

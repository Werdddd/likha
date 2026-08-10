import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ quantity, onChange, min = 1, max = 99 }: QuantityStepperProps) {
  return (
    <View style={styles.row}>
      <AnimatedPressable
        style={styles.button}
        disabled={quantity <= min}
        onPress={() => onChange(Math.max(min, quantity - 1))}
        scaleTo={0.9}
        hitSlop={6}
      >
        <Ionicons name="remove" size={16} color={quantity <= min ? colors.softGray : colors.ink} />
      </AnimatedPressable>
      <Text style={styles.count}>{quantity}</Text>
      <AnimatedPressable
        style={styles.button}
        disabled={quantity >= max}
        onPress={() => onChange(Math.min(max, quantity + 1))}
        scaleTo={0.9}
        hitSlop={6}
      >
        <Ionicons name="add" size={16} color={quantity >= max ? colors.softGray : colors.ink} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.pill,
  },
  button: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...t.bodyMedium,
    color: colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
});

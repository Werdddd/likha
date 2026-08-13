import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, onPress, disabled, style, padding = spacing.md }: CardProps) {
  const composed = [styles.base, { padding }, style];
  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} disabled={disabled} scaleTo={0.98} style={composed}>
        {children}
      </AnimatedPressable>
    );
  }
  return <View style={composed}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';
import { AnimatedPressable } from './ui';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  emptyColor?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Read-only stars with proportional fill, e.g. a 4.3 average renders a 30%-filled 4th star. */
export function StarRating({ rating, size = 14, color = colors.golden, emptyColor = colors.softGray }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {STARS.map((n) => {
        const fill = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <View key={n} style={{ width: size, height: size }}>
            <Ionicons name="star" size={size} color={emptyColor} style={StyleSheet.absoluteFill} />
            {fill > 0 && (
              <View style={[styles.clip, { width: `${fill * 100}%` }]}>
                <Ionicons name="star" size={size} color={color} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Tappable whole-star input for writing a review. */
export function StarRatingInput({ value, onChange, size = 32, color = colors.golden, emptyColor = colors.softGray }: StarRatingInputProps) {
  return (
    <View style={styles.row}>
      {STARS.map((n) => (
        <AnimatedPressable key={n} onPress={() => onChange(n)} scaleTo={0.85} style={styles.inputStar}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? color : emptyColor} />
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  clip: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    overflow: 'hidden',
  },
  inputStar: {
    paddingHorizontal: 2,
  },
});

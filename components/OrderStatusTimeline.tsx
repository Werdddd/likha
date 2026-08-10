import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import { ORDER_STATUS_STEPS } from '../lib/order-status';
import type { OrderStatus } from '../types';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const currentIndex = ORDER_STATUS_STEPS.findIndex((step) => step.status === status);

  return (
    <View style={styles.row}>
      {ORDER_STATUS_STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        return (
          <View key={step.status} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View style={[styles.dot, reached && styles.dotReached]}>
                {reached && <Ionicons name="checkmark" size={11} color={colors.canvas} />}
              </View>
              {index < ORDER_STATUS_STEPS.length - 1 && (
                <View style={[styles.line, index < currentIndex && styles.lineReached]} />
              )}
            </View>
            <Text style={[styles.label, reached && styles.labelReached]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  stepWrap: {
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotReached: {
    backgroundColor: colors.likhaYellow,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.softGray,
  },
  lineReached: {
    backgroundColor: colors.likhaYellow,
  },
  label: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.xs,
  },
  labelReached: {
    color: colors.ink,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

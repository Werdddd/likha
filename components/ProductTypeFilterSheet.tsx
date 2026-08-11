import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import type { ProductType } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Chip } from './ui/Chip';

interface ProductTypeFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  options: Array<{ value: ProductType; label: string }>;
  value: ProductType | null;
  onSelect: (value: ProductType | null) => void;
}

export function ProductTypeFilterSheet({ visible, onClose, options, value, onSelect }: ProductTypeFilterSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter</Text>
            <AnimatedPressable onPress={onClose} scaleTo={0.9} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </AnimatedPressable>
          </View>

          <Text style={styles.groupLabel}>Product type</Text>
          <View style={styles.chipWrap}>
            <Chip
              label="All"
              selected={value === null}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
            />
            {options.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={value === option.value}
                onPress={() => {
                  onSelect(value === option.value ? null : option.value);
                  onClose();
                }}
              />
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(32, 32, 28, 0.4)',
  },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    ...t.h2,
    color: colors.ink,
  },
  groupLabel: {
    ...t.label,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});

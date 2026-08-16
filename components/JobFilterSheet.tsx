import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { TextField } from './ui/TextField';

interface JobFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  regions: string[];
  region: string | null;
  onSelectRegion: (value: string | null) => void;
  maxBudget: string;
  onChangeMaxBudget: (value: string) => void;
  deadlineBefore: string;
  onChangeDeadlineBefore: (value: string) => void;
  resultCount: number;
}

export function JobFilterSheet({
  visible,
  onClose,
  regions,
  region,
  onSelectRegion,
  maxBudget,
  onChangeMaxBudget,
  deadlineBefore,
  onChangeDeadlineBefore,
  resultCount,
}: JobFilterSheetProps) {
  const hasFilters = region !== null || maxBudget.trim().length > 0 || deadlineBefore.trim().length > 0;

  const clearAll = () => {
    onSelectRegion(null);
    onChangeMaxBudget('');
    onChangeDeadlineBefore('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <AnimatedPressable onPress={onClose} scaleTo={0.9} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </AnimatedPressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.groupLabel}>Region</Text>
            <View style={styles.chipWrap}>
              <Chip label="All" selected={region === null} onPress={() => onSelectRegion(null)} />
              {regions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={region === option}
                  onPress={() => onSelectRegion(region === option ? null : option)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Max budget (₱)</Text>
            <TextField
              label=""
              placeholder="Any"
              keyboardType="numeric"
              value={maxBudget}
              onChangeText={onChangeMaxBudget}
              containerStyle={styles.field}
            />

            <Text style={styles.groupLabel}>Deadline before</Text>
            <TextField
              label=""
              placeholder="YYYY-MM-DD"
              value={deadlineBefore}
              onChangeText={onChangeDeadlineBefore}
              containerStyle={styles.field}
            />
          </ScrollView>

          <View style={styles.footer}>
            <AnimatedPressable onPress={clearAll} disabled={!hasFilters} scaleTo={0.96} hitSlop={8}>
              <Text style={[styles.clearLabel, !hasFilters && styles.clearLabelDisabled]}>Clear all</Text>
            </AnimatedPressable>
            <Button
              label={`Show ${resultCount} result${resultCount === 1 ? '' : 's'}`}
              onPress={onClose}
              style={styles.showButton}
            />
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
    maxHeight: '85%',
    ...shadow.lg,
  },
  scroll: {
    flexGrow: 0,
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
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  clearLabel: {
    ...t.bodyMedium,
    color: colors.terracotta,
  },
  clearLabelDisabled: {
    color: colors.warmBrown,
    opacity: 0.4,
  },
  showButton: {
    flex: 1,
    marginLeft: spacing.lg,
  },
});

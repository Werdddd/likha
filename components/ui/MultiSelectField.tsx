import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface MultiSelectFieldProps {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  max: number;
  icon?: keyof typeof Ionicons.glyphMap;
  searchPlaceholder?: string;
}

export function MultiSelectField({
  label,
  values,
  options,
  onChange,
  max,
  icon = 'layers-outline',
  searchPlaceholder = 'Search...',
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const atMax = values.length >= max;

  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else if (!atMax) {
      onChange([...values, option]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable style={styles.field} onPress={() => setOpen(true)} scaleTo={0.98}>
        <Ionicons name={icon} size={17} color={colors.warmBrown} style={styles.fieldIcon} />
        <Text style={styles.fieldValue} numberOfLines={1}>
          {values.length > 0 ? values.join(', ') : `Select up to ${max}`}
        </Text>
        <Text style={styles.fieldCount}>
          {values.length}/{max}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.warmBrown} />
      </AnimatedPressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{label}</Text>
                <Text style={styles.sheetSubtitle}>
                  {values.length}/{max} selected
                </Text>
              </View>
              <AnimatedPressable onPress={handleClose} scaleTo={0.95} hitSlop={8}>
                <Text style={styles.doneLabel}>Done</Text>
              </AnimatedPressable>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={colors.warmBrown} style={styles.searchIcon} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.warmBrown}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.optionDivider} />}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
              renderItem={({ item }) => {
                const selected = values.includes(item);
                const disabled = !selected && atMax;
                return (
                  <AnimatedPressable
                    style={[styles.option, disabled && styles.optionDisabled]}
                    onPress={() => toggle(item)}
                    scaleTo={disabled ? 1 : 0.98}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{item}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color={colors.canvas} />}
                    </View>
                  </AnimatedPressable>
                );
              }}
              style={styles.list}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  fieldIcon: {
    marginRight: spacing.sm,
  },
  fieldValue: {
    ...t.body,
    color: colors.ink,
    flex: 1,
  },
  fieldCount: {
    ...t.caption,
    color: colors.warmBrown,
    marginRight: spacing.sm,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(32, 32, 28, 0.4)',
  },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '75%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadow.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...t.h3,
    color: colors.ink,
  },
  sheetSubtitle: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  doneLabel: {
    ...t.bodyMedium,
    color: colors.terracotta,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...t.body,
    color: colors.ink,
    flex: 1,
    paddingVertical: spacing.sm + 2,
  },
  list: {
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  optionLabel: {
    ...t.body,
    color: colors.ink,
  },
  optionLabelSelected: {
    fontFamily: t.bodyMedium.fontFamily,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

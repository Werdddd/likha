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

import { CUSTOM_CATEGORY_ICON, iconForCategory } from '../constants/category-icons';
import { categories } from '../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { AnimatedPressable } from './ui/AnimatedPressable';

interface CategoryMultiSelectFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export function CategoryMultiSelectField({ label, values, onChange }: CategoryMultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const customValues = useMemo(
    () => values.filter((v) => !(categories as string[]).includes(v)),
    [values],
  );

  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  };

  const remove = (option: string) => onChange(values.filter((v) => v !== option));

  const addCustom = () => {
    const trimmed = customDraft.trim();
    if (!trimmed || values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setCustomDraft('');
      return;
    }
    onChange([...values, trimmed]);
    setCustomDraft('');
  };

  const handleClose = () => {
    setOpen(false);
    setCustomDraft('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable style={styles.field} onPress={() => setOpen(true)} scaleTo={0.98}>
        <Ionicons name="pricetags-outline" size={17} color={colors.warmBrown} style={styles.fieldIcon} />
        <Text style={styles.fieldValue} numberOfLines={1}>
          {values.length > 0 ? values.join(', ') : 'Select categories'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.warmBrown} />
      </AnimatedPressable>

      {values.length > 0 && (
        <View style={styles.chipWrap}>
          {values.map((value) => (
            <View key={value} style={styles.chip}>
              <Ionicons name={iconForCategory(value)} size={13} color={colors.ink} />
              <Text style={styles.chipLabel}>{value}</Text>
              <AnimatedPressable onPress={() => remove(value)} scaleTo={0.85} hitSlop={6}>
                <Ionicons name="close" size={13} color={colors.warmBrown} />
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <AnimatedPressable onPress={handleClose} scaleTo={0.95} hitSlop={8}>
                <Text style={styles.doneLabel}>Done</Text>
              </AnimatedPressable>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.optionDivider} />}
              renderItem={({ item }) => {
                const selected = values.includes(item);
                return (
                  <AnimatedPressable style={styles.option} onPress={() => toggle(item)} scaleTo={0.98}>
                    <View style={styles.optionIconWrap}>
                      <Ionicons name={iconForCategory(item)} size={16} color={selected ? colors.ink : colors.warmBrown} />
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{item}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color={colors.canvas} />}
                    </View>
                  </AnimatedPressable>
                );
              }}
              ListFooterComponent={
                <View style={styles.customSection}>
                  <Text style={styles.customLabel}>Other</Text>
                  <View style={styles.customInputRow}>
                    <TextInput
                      value={customDraft}
                      onChangeText={setCustomDraft}
                      placeholder="Type a custom category"
                      placeholderTextColor={colors.warmBrown}
                      style={styles.customInput}
                      onSubmitEditing={addCustom}
                      returnKeyType="done"
                    />
                    <AnimatedPressable style={styles.addCustomButton} onPress={addCustom} scaleTo={0.92}>
                      <Ionicons name="add" size={18} color={colors.ink} />
                    </AnimatedPressable>
                  </View>

                  {customValues.length > 0 && (
                    <View style={styles.chipWrap}>
                      {customValues.map((value) => (
                        <View key={value} style={styles.chip}>
                          <Ionicons name={CUSTOM_CATEGORY_ICON} size={13} color={colors.ink} />
                          <Text style={styles.chipLabel}>{value}</Text>
                          <AnimatedPressable onPress={() => remove(value)} scaleTo={0.85} hitSlop={6}>
                            <Ionicons name="close" size={13} color={colors.warmBrown} />
                          </AnimatedPressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              }
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipLabel: {
    ...t.caption,
    color: colors.ink,
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
    maxHeight: '80%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadow.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...t.h3,
    color: colors.ink,
  },
  doneLabel: {
    ...t.bodyMedium,
    color: colors.terracotta,
  },
  list: {
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  optionIconWrap: {
    width: 28,
    alignItems: 'flex-start',
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  optionLabel: {
    ...t.body,
    color: colors.ink,
    flex: 1,
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
  customSection: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  customLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    ...t.body,
    flex: 1,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  addCustomButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

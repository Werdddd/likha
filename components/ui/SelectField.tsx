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

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  searchPlaceholder?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  icon = 'chevron-down-outline',
  searchPlaceholder = 'Search...',
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (option: string) => {
    onChange(option);
    handleClose();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable style={styles.field} onPress={() => setOpen(true)} scaleTo={0.98}>
        <Ionicons name={icon} size={17} color={colors.warmBrown} style={styles.fieldIcon} />
        <Text style={styles.fieldValue}>{value}</Text>
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
              <Text style={styles.sheetTitle}>{label}</Text>
              <AnimatedPressable onPress={handleClose} scaleTo={0.9} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.ink} />
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
              renderItem={({ item }) => (
                <AnimatedPressable style={styles.option} onPress={() => handleSelect(item)} scaleTo={0.98}>
                  <Text style={[styles.optionLabel, item === value && styles.optionLabelSelected]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.ink} />}
                </AnimatedPressable>
              )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...t.h3,
    color: colors.ink,
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
    ...(Platform.OS === 'ios' ? { lineHeight: undefined } : null),
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
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

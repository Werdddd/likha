import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

interface ModerationNoteSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** Whether a non-empty note is required before the confirm button enables. */
  requireNote?: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}

export function ModerationNoteSheet({
  visible,
  title,
  body,
  confirmLabel,
  requireNote = true,
  onCancel,
  onConfirm,
}: ModerationNoteSheetProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) setNote('');
  }, [visible]);

  const canConfirm = !requireNote || note.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <AnimatedPressable onPress={onCancel} scaleTo={0.9} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </AnimatedPressable>
          </View>

          <Text style={styles.body}>{body}</Text>

          <TextField
            label={requireNote ? 'Reason *' : 'Reason (optional)'}
            placeholder="Explain why, so the creator understands"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            containerStyle={styles.field}
          />

          <View style={styles.actionRow}>
            <Button label="Cancel" variant="ghost" onPress={onCancel} style={styles.actionButton} />
            <Button
              label={confirmLabel}
              variant="secondary"
              disabled={!canConfirm}
              onPress={() => onConfirm(note.trim())}
              style={styles.actionButton}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...t.h2,
    color: colors.ink,
  },
  body: {
    ...t.body,
    color: colors.warmBrown,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

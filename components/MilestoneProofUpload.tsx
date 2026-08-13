import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import { pickAndUploadPrivateImage } from '../lib/upload';
import { AnimatedPressable } from './ui';

export interface ProofValue {
  path: string;
  previewUri: string;
}

interface MilestoneProofUploadProps {
  bucket: string;
  userId: string;
  prefix: string;
  value: ProofValue | null;
  onChange: (value: ProofValue | null) => void;
  hint?: string;
}

export function MilestoneProofUpload({ bucket, userId, prefix, value, onChange, hint }: MilestoneProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    setIsUploading(true);
    const result = await pickAndUploadPrivateImage(bucket, userId, prefix);
    setIsUploading(false);
    if (result) onChange(result);
  };

  return (
    <View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value.previewUri }} style={styles.preview} contentFit="cover" />
          <AnimatedPressable style={styles.removeButton} scaleTo={0.9} onPress={() => onChange(null)} hitSlop={6}>
            <Ionicons name="close" size={13} color={colors.white} />
          </AnimatedPressable>
        </View>
      ) : (
        <AnimatedPressable style={styles.picker} scaleTo={0.98} onPress={handlePick} disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.warmBrown} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.warmBrown} />
              <Text style={styles.pickerLabel}>Upload proof of payment</Text>
            </>
          )}
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  pickerLabel: {
    ...t.bodyMedium,
    color: colors.warmBrown,
  },
  previewWrap: {
    width: 96,
    height: 96,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
});

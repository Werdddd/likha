import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import { pickAndUploadImages } from '../lib/upload';
import { useSessionStore } from '../store/session-store';
import { CategoryMultiSelectField } from './CategoryMultiSelectField';
import { AnimatedPressable, Button, TextField } from './ui';

export interface ProjectFormValues {
  title: string;
  description: string;
  categories: string[];
  mediums: string;
  media: string[];
}

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ initialValues, submitLabel, onSubmit, isSubmitting }: ProjectFormProps) {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [categories, setCategories] = useState<string[]>(initialValues?.categories ?? []);
  const [mediums, setMediums] = useState(initialValues?.mediums ?? '');
  const [media, setMedia] = useState<string[]>(initialValues?.media ?? []);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && categories.length > 0 && !isSubmitting;

  const handleAddMedia = async () => {
    setIsUploadingMedia(true);
    const urls = await pickAndUploadImages('project-media', currentUserId, 'media');
    setIsUploadingMedia(false);
    if (urls.length > 0) setMedia((prev) => [...prev, ...urls]);
  };

  const handleRemoveMedia = (url: string) => {
    setMedia((prev) => prev.filter((m) => m !== url));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Media</Text>
      <View style={styles.mediaRow}>
        {media.map((url) => (
          <View key={url} style={styles.mediaThumbWrap}>
            <Image source={{ uri: url }} style={styles.mediaThumb} contentFit="cover" />
            <AnimatedPressable
              style={styles.removeMediaButton}
              scaleTo={0.9}
              onPress={() => handleRemoveMedia(url)}
              hitSlop={6}
            >
              <Ionicons name="close" size={13} color={colors.white} />
            </AnimatedPressable>
          </View>
        ))}
        <AnimatedPressable style={styles.addMedia} scaleTo={0.95} onPress={handleAddMedia} disabled={isUploadingMedia}>
          {isUploadingMedia ? (
            <ActivityIndicator size="small" color={colors.warmBrown} />
          ) : (
            <>
              <Ionicons name="add" size={22} color={colors.warmBrown} />
              <Text style={styles.addMediaLabel}>Add</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <Text style={styles.requiredHint}>Fields marked * are required.</Text>

      <TextField label="Title *" placeholder="Project title" value={title} onChangeText={setTitle} />
      <TextField
        label="Description *"
        placeholder="Describe your process and the story behind the work"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />
      <TextField
        label="Mediums (comma separated)"
        placeholder="watercolor, editorial"
        value={mediums}
        onChangeText={setMediums}
      />

      <CategoryMultiSelectField label="Categories *" values={categories} onChange={setCategories} />

      <Button
        label={submitLabel}
        disabled={!canSubmit}
        onPress={() =>
          onSubmit({ title: title.trim(), description: description.trim(), categories, mediums, media })
        }
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mediaThumbWrap: {
    width: 88,
    height: 88,
  },
  mediaThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  removeMediaButton: {
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
  requiredHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  addMedia: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray + '4d',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addMediaLabel: {
    ...t.label,
    color: colors.warmBrown,
  },
  submit: {
    marginTop: spacing.sm,
  },
});

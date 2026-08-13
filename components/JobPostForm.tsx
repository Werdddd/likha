import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { categories, regions } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { pickAndUploadImages } from '../lib/upload';
import type { Category, ProductType, Region } from '../types';
import { AnimatedPressable, Button, CheckboxSelectField, Chip, SelectField, TextField } from './ui';

export interface JobPostFormValues {
  title: string;
  description: string;
  category: Category;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetFlexible: boolean;
  deadline: string | null;
  deliverableType: ProductType;
  region: Region | null;
  images: string[];
}

const DELIVERABLE_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital file' },
  { value: 'physical', label: 'Physical / shipped' },
];

const ANY_REGION = 'Any region';

interface JobPostFormProps {
  submitLabel: string;
  onSubmit: (values: JobPostFormValues) => void;
  isSubmitting?: boolean;
  userId: string;
}

export function JobPostForm({ submitLabel, onSubmit, isSubmitting, userId }: JobPostFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetFlexible, setBudgetFlexible] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [deliverableType, setDeliverableType] = useState<ProductType>('digital');
  const [region, setRegion] = useState(ANY_REGION);
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isSubmitting;

  const handleAddImages = async () => {
    setIsUploadingImages(true);
    const urls = await pickAndUploadImages('job-post-images', userId, 'ref');
    setIsUploadingImages(false);
    if (urls.length > 0) setImages((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      budgetMin: budgetMin.trim().length > 0 ? Number(budgetMin) : null,
      budgetMax: budgetMax.trim().length > 0 ? Number(budgetMax) : null,
      budgetFlexible,
      deadline: deadline.trim().length > 0 ? deadline.trim() : null,
      deliverableType,
      region: region === ANY_REGION ? null : (region as Region),
      images,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Reference images (optional)</Text>
      <View style={styles.mediaRow}>
        {images.map((url) => (
          <View key={url} style={styles.mediaThumbWrap}>
            <Image source={{ uri: url }} style={styles.mediaThumb} contentFit="cover" />
            <AnimatedPressable
              style={styles.removeMediaButton}
              scaleTo={0.9}
              onPress={() => handleRemoveImage(url)}
              hitSlop={6}
            >
              <Ionicons name="close" size={13} color={colors.white} />
            </AnimatedPressable>
          </View>
        ))}
        <AnimatedPressable
          style={styles.addMedia}
          scaleTo={0.95}
          onPress={handleAddImages}
          disabled={isUploadingImages}
        >
          {isUploadingImages ? (
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

      <TextField label="Title *" placeholder="What do you need done?" value={title} onChangeText={setTitle} />
      <TextField
        label="Brief *"
        placeholder="Describe the work, deliverables, and any must-haves"
        multiline
        numberOfLines={5}
        value={description}
        onChangeText={setDescription}
      />

      <CheckboxSelectField
        label="Category *"
        value={category}
        options={categories}
        onChange={(v) => setCategory(v as Category)}
        icon="grid-outline"
        searchable={false}
      />

      <CheckboxSelectField
        label="Deliverable type *"
        value={DELIVERABLE_TYPES.find((o) => o.value === deliverableType)?.label ?? DELIVERABLE_TYPES[0].label}
        options={DELIVERABLE_TYPES.map((o) => o.label)}
        onChange={(label) => {
          const option = DELIVERABLE_TYPES.find((o) => o.label === label);
          if (option) setDeliverableType(option.value);
        }}
        icon="cube-outline"
        searchable={false}
      />

      <Text style={styles.sectionLabel}>Budget</Text>
      <View style={styles.chipWrap}>
        <Chip label="Open to quotes" selected={budgetFlexible} onPress={() => setBudgetFlexible((v) => !v)} />
      </View>
      <View style={styles.budgetRow}>
        <TextField
          label="Min (₱)"
          placeholder="0"
          keyboardType="numeric"
          value={budgetMin}
          onChangeText={setBudgetMin}
          containerStyle={styles.budgetField}
        />
        <TextField
          label="Max (₱)"
          placeholder="0"
          keyboardType="numeric"
          value={budgetMax}
          onChangeText={setBudgetMax}
          containerStyle={styles.budgetField}
        />
      </View>

      <TextField
        label="Deadline (YYYY-MM-DD, optional)"
        placeholder="2026-09-30"
        value={deadline}
        onChangeText={setDeadline}
      />

      <SelectField
        label="Region (optional)"
        value={region}
        options={[ANY_REGION, ...regions]}
        onChange={setRegion}
        icon="location-outline"
      />

      <Button label={submitLabel} disabled={!canSubmit} onPress={handleSubmit} style={styles.submit} />
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  budgetField: {
    flex: 1,
  },
  submit: {
    marginTop: spacing.sm,
  },
});

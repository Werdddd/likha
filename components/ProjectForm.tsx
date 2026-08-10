import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { disciplines } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import type { Discipline } from '../types';
import { AnimatedPressable, Button, Chip, TextField } from './ui';

export interface ProjectFormValues {
  title: string;
  description: string;
  discipline: Discipline;
  mediums: string;
}

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
}

const placeholderMedia = ['pf-media-1', 'pf-media-2'];

export function ProjectForm({ initialValues, submitLabel, onSubmit }: ProjectFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [discipline, setDiscipline] = useState<Discipline>(initialValues?.discipline ?? 'Illustration');
  const [mediums, setMediums] = useState(initialValues?.mediums ?? '');
  const [mediaSeeds, setMediaSeeds] = useState<string[]>(placeholderMedia);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Media</Text>
      <View style={styles.mediaRow}>
        {mediaSeeds.map((seed) => (
          <Image
            key={seed}
            source={{ uri: `https://picsum.photos/seed/${seed}/300/300` }}
            style={styles.mediaThumb}
            contentFit="cover"
          />
        ))}
        <AnimatedPressable
          style={styles.addMedia}
          scaleTo={0.95}
          onPress={() => setMediaSeeds((prev) => [...prev, `pf-media-${prev.length + 1}-${Date.now()}`])}
        >
          <Ionicons name="add" size={22} color={colors.warmBrown} />
          <Text style={styles.addMediaLabel}>Add</Text>
        </AnimatedPressable>
      </View>

      <TextField label="Title" placeholder="Project title" value={title} onChangeText={setTitle} />
      <TextField
        label="Description"
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

      <Text style={styles.sectionLabel}>Discipline</Text>
      <View style={styles.chipWrap}>
        {disciplines.map((d) => (
          <Chip key={d} label={d} selected={discipline === d} onPress={() => setDiscipline(d)} />
        ))}
      </View>

      <Button
        label={submitLabel}
        disabled={!canSubmit}
        onPress={() => onSubmit({ title: title.trim(), description: description.trim(), discipline, mediums })}
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
  mediaThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
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
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
});

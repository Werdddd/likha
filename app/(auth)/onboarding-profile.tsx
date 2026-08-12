import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, MultiSelectField, TextField } from '../../components/ui';
import { categories, regions } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';
import type { Category, Region } from '../../types';

export default function OnboardingProfileScreen() {
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState<Region>('Manila');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['Illustration']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await completeOnboarding({ bio: bio.trim(), region, categories: selectedCategories, tags: [] });
    setIsSubmitting(false);
    router.replace('/(tabs)/discover');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tell us about your work</Text>
        <Text style={styles.subtitle}>This appears on your public profile.</Text>

        <TextField
          label="Bio"
          placeholder="Illustrator based in Manila, drawing everyday stories..."
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
        />

        <MultiSelectField
          label="Categories"
          values={selectedCategories}
          options={categories}
          onChange={(v) => setSelectedCategories(v as Category[])}
          max={3}
          icon="layers-outline"
          searchPlaceholder="Search categories"
        />

        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.chipWrap}>
          {regions.map((r) => (
            <Chip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />
          ))}
        </View>

        <Button
          label="Finish Setup"
          onPress={handleFinish}
          disabled={selectedCategories.length === 0 || isSubmitting}
          style={styles.finishButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  subtitle: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  finishButton: {
    marginTop: spacing.md,
  },
});

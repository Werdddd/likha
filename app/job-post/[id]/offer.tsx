import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SelectField, TextField } from '../../../components/ui';
import { colors, spacing, type as t } from '../../../constants/theme';
import { formatPrice } from '../../../lib/format';
import { useJobOfferStore } from '../../../store/job-offer-store';
import { useJobPostStore } from '../../../store/job-post-store';
import { useProjectStore } from '../../../store/project-store';
import { useSessionStore } from '../../../store/session-store';

const NO_PROJECT = 'None';

export default function SubmitOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useSessionStore((s) => s.currentUser);
  const submitOffer = useJobOfferStore((s) => s.submitOffer);
  const jobPost = useJobPostStore((s) => s.jobPostsById[id]);
  const fetchJobPostById = useJobPostStore((s) => s.fetchById);
  const fetchByCreator = useProjectStore((s) => s.fetchByCreator);
  const projectsById = useProjectStore((s) => s.projectsById);
  const myProjects = useMemo(
    () => Object.values(projectsById).filter((p) => p.creatorId === currentUser.id),
    [projectsById, currentUser.id],
  );

  useEffect(() => {
    if (currentUser.id) fetchByCreator(currentUser.id);
  }, [currentUser.id, fetchByCreator]);

  useEffect(() => {
    if (!jobPost) fetchJobPostById(id);
  }, [id, jobPost, fetchJobPostById]);

  const [price, setPrice] = useState('');
  const [turnaroundDays, setTurnaroundDays] = useState('');
  const [pitch, setPitch] = useState('');
  const [projectTitle, setProjectTitle] = useState(NO_PROJECT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceValue = Number(price);
  const turnaroundValue = Number(turnaroundDays);
  // Budget is only a hard ceiling when the buyer set a fixed max; "open to quotes" posts (or
  // ones with no max at all) don't constrain the price.
  const budgetMax = !jobPost?.budgetFlexible ? (jobPost?.budgetMax ?? null) : null;
  const exceedsBudget = budgetMax !== null && priceValue > budgetMax;
  const canSubmit =
    priceValue > 0 && turnaroundValue > 0 && pitch.trim().length > 0 && !exceedsBudget && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const linkedProject = myProjects.find((p) => p.title === projectTitle);

    setIsSubmitting(true);
    const { offer, error } = await submitOffer(id, currentUser.id, {
      price: priceValue,
      turnaroundDays: turnaroundValue,
      pitch: pitch.trim(),
      portfolioProjectId: linkedProject?.id,
    });
    setIsSubmitting(false);

    if (!offer) {
      Alert.alert('Could not submit offer', error ?? 'Please try again.');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Submit an Offer' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Your price (₱) *"
          placeholder="0"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        {budgetMax !== null && (
          <Text style={[styles.budgetHint, exceedsBudget && styles.budgetHintError]}>
            {exceedsBudget
              ? `This exceeds the buyer's budget of up to ${formatPrice(budgetMax)}.`
              : `Buyer's budget: up to ${formatPrice(budgetMax)}.`}
          </Text>
        )}
        <TextField
          label="Turnaround (days) *"
          placeholder="e.g. 7"
          keyboardType="numeric"
          value={turnaroundDays}
          onChangeText={setTurnaroundDays}
        />
        <TextField
          label="Pitch *"
          placeholder="Why you're a good fit, and how you'd approach this"
          multiline
          numberOfLines={5}
          value={pitch}
          onChangeText={setPitch}
        />
        {myProjects.length > 0 && (
          <SelectField
            label="Show proof of work (optional)"
            value={projectTitle}
            options={[NO_PROJECT, ...myProjects.map((p) => p.title)]}
            onChange={setProjectTitle}
            icon="sparkles-outline"
          />
        )}
        <Button
          label={isSubmitting ? 'Submitting…' : 'Submit Offer'}
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={styles.submit}
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
  budgetHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  budgetHintError: {
    color: colors.terracotta,
  },
  submit: {
    marginTop: spacing.sm,
  },
});

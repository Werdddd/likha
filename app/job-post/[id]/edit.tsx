import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobPostForm, type JobPostFormValues } from '../../../components/JobPostForm';
import { Button } from '../../../components/ui';
import { colors, spacing, type as t } from '../../../constants/theme';
import { useJobPostStore } from '../../../store/job-post-store';
import { useSessionStore } from '../../../store/session-store';
import type { JobPost } from '../../../types';

export default function EditJobPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const cachedJobPost = useJobPostStore((s) => s.jobPostsById[id]);
  const fetchById = useJobPostStore((s) => s.fetchById);
  const updateJobPost = useJobPostStore((s) => s.updateJobPost);
  const deleteJobPost = useJobPostStore((s) => s.deleteJobPost);

  const [jobPost, setJobPost] = useState<JobPost | null | undefined>(cachedJobPost);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (cachedJobPost) {
      setJobPost(cachedJobPost);
      return;
    }
    fetchById(id).then(setJobPost);
  }, [id, cachedJobPost, fetchById]);

  const handleSubmit = async (values: JobPostFormValues) => {
    setIsSubmitting(true);
    const { images, ...rest } = values;
    const { jobPost: updated, error } = await updateJobPost(id, { ...rest, imageUrls: images });
    setIsSubmitting(false);

    if (!updated) {
      Alert.alert('Could not save changes', error ?? 'Please try again.');
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this job post?',
      'This permanently removes it. Creators will no longer be able to see or offer on it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteJobPost(id);
            setIsDeleting(false);
            if (error) {
              Alert.alert('Could not delete this job post', error);
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  if (jobPost === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Job Post' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!jobPost || jobPost.buyerId !== currentUserId) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Job Post' }} />
        <Text style={styles.body}>Job post not found.</Text>
      </SafeAreaView>
    );
  }

  if (jobPost.status !== 'open') {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Job Post' }} />
        <Text style={styles.body}>
          {jobPost.status === 'fulfilled'
            ? "This job post has already been fulfilled and can't be edited."
            : 'This job post was cancelled and can’t be edited.'}
        </Text>
        <View style={styles.footer}>
          <Button
            label={isDeleting ? 'Deleting…' : 'Delete job post'}
            variant="ghost"
            disabled={isDeleting || jobPost.status === 'fulfilled'}
            onPress={handleDelete}
            style={styles.footerButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Edit Job Post' }} />
      <JobPostForm
        initialValues={{
          title: jobPost.title,
          description: jobPost.description,
          category: jobPost.category,
          budgetMin: jobPost.budgetMin,
          budgetMax: jobPost.budgetMax,
          budgetFlexible: jobPost.budgetFlexible,
          deadline: jobPost.deadline,
          deliverableType: jobPost.deliverableType,
          region: jobPost.region,
          images: jobPost.images,
        }}
        submitLabel={isSubmitting ? 'Saving…' : 'Save Changes'}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        userId={currentUserId}
      />

      <View style={styles.footer}>
        <Button
          label={isDeleting ? 'Deleting…' : 'Delete job post'}
          variant="ghost"
          disabled={isDeleting || isSubmitting}
          onPress={handleDelete}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loading: {
    marginTop: spacing.xl,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  footerButton: {
    alignSelf: 'stretch',
  },
});

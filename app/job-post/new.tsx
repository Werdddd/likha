import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobPostForm, type JobPostFormValues } from '../../components/JobPostForm';
import { colors } from '../../constants/theme';
import { useJobPostStore } from '../../store/job-post-store';
import { useSessionStore } from '../../store/session-store';

export default function NewJobPostScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const createJobPost = useJobPostStore((s) => s.createJobPost);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: JobPostFormValues) => {
    setIsSubmitting(true);
    const { images, ...rest } = values;
    const { jobPost, error } = await createJobPost(currentUser.id, { ...rest, imageUrls: images });
    setIsSubmitting(false);

    if (!jobPost) {
      Alert.alert('Could not post this job', error ?? 'Please try again.');
      return;
    }
    router.replace(`/job-post/${jobPost.id}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Post a Job' }} />
      <JobPostForm submitLabel="Post Job" onSubmit={handleSubmit} isSubmitting={isSubmitting} userId={currentUser.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

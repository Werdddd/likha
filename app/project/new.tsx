import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm, type ProjectFormValues } from '../../components/ProjectForm';
import { colors } from '../../constants/theme';
import { useProjectStore } from '../../store/project-store';
import { useSessionStore } from '../../store/session-store';

export default function NewProjectScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const createProject = useProjectStore((s) => s.createProject);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    const { project, error } = await createProject(currentUser.id, {
      title: values.title,
      description: values.description,
      categories: values.categories,
      mediums: values.mediums
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      region: currentUser.region,
      mediaUrls: values.media,
      moderationStatus: values.hasFlaggedMedia ? 'pending_review' : 'clean',
      moderationReason: values.moderationReason,
    });
    setIsSubmitting(false);

    if (!project) {
      Alert.alert('Could not publish project', error ?? 'Please try again.');
      return;
    }

    if (project.moderationStatus === 'pending_review') {
      Alert.alert('Submitted for review', "This won't be visible to others until an admin reviews it.");
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'New Project' }} />
      <ProjectForm submitLabel="Publish Project" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

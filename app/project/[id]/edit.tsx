import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm, type ProjectFormValues } from '../../../components/ProjectForm';
import { colors, spacing, type as t } from '../../../constants/theme';
import { useProjectStore } from '../../../store/project-store';
import type { Project } from '../../../types';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedProject = useProjectStore((s) => s.projectsById[id]);
  const fetchById = useProjectStore((s) => s.fetchById);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [project, setProject] = useState<Project | null | undefined>(cachedProject);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cachedProject) {
      setProject(cachedProject);
      return;
    }
    fetchById(id).then(setProject);
  }, [id, cachedProject, fetchById]);

  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    const { project: updated, error } = await updateProject(id, {
      title: values.title,
      description: values.description,
      categories: values.categories,
      mediums: values.mediums
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      mediaUrls: values.media,
    });
    setIsSubmitting(false);

    if (!updated) {
      Alert.alert('Could not save changes', error ?? 'Please try again.');
      return;
    }
    router.back();
  };

  if (project === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Project' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Project' }} />
        <Text style={styles.body}>Project not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Edit Project' }} />
      <ProjectForm
        initialValues={{
          title: project.title,
          description: project.description,
          categories: project.categories,
          mediums: project.mediums.join(', '),
          media: project.media.map((m) => m.url),
        }}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
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
});

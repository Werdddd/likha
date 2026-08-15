import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm, type ProjectFormValues } from '../../../components/ProjectForm';
import { Button } from '../../../components/ui';
import { colors, spacing, type as t } from '../../../constants/theme';
import { useProjectStore } from '../../../store/project-store';
import { useSessionStore } from '../../../store/session-store';
import type { Project } from '../../../types';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const cachedProject = useProjectStore((s) => s.projectsById[id]);
  const fetchById = useProjectStore((s) => s.fetchById);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [project, setProject] = useState<Project | null | undefined>(cachedProject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = () => {
    Alert.alert('Delete this project?', 'This permanently removes it from your portfolio.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          const { error } = await deleteProject(id);
          setIsDeleting(false);
          if (error) {
            Alert.alert('Could not delete project', error);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  if (project === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Project' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!project || project.creatorId !== currentUserId) {
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

      <View style={styles.footer}>
        <Button
          label={isDeleting ? 'Deleting…' : 'Delete project'}
          variant="ghost"
          disabled={isDeleting}
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  footerButton: {
    alignSelf: 'stretch',
  },
});

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm } from '../../../components/ProjectForm';
import { getProjectById } from '../../../constants/mock-data';
import { colors, spacing, type as t } from '../../../constants/theme';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = getProjectById(id);

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
          category: project.category,
          mediums: project.mediums.join(', '),
        }}
        submitLabel="Save Changes"
        onSubmit={() => {
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

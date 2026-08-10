import { router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm } from '../../components/ProjectForm';
import { colors } from '../../constants/theme';

export default function NewProjectScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'New Project' }} />
      <ProjectForm
        submitLabel="Publish Project"
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
});

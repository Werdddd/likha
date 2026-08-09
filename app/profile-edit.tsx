import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, TextField } from '../components/ui';
import { disciplines, regions } from '../constants/mock-data';
import { colors, spacing, type as t } from '../constants/theme';
import { useSessionStore } from '../store/session-store';
import type { Discipline, Region } from '../types';

export default function ProfileEditScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const updateProfile = useSessionStore((s) => s.updateProfile);

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [region, setRegion] = useState<Region>(currentUser.region);
  const [discipline, setDiscipline] = useState<Discipline>(currentUser.discipline);

  const handleSave = () => {
    updateProfile({ name: name.trim(), bio: bio.trim(), region, discipline });
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="Name" value={name} onChangeText={setName} />
        <TextField label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />

        <Text style={styles.sectionLabel}>Discipline</Text>
        <View style={styles.chipWrap}>
          {disciplines.map((d) => (
            <Chip key={d} label={d} selected={discipline === d} onPress={() => setDiscipline(d)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.chipWrap}>
          {regions.map((r) => (
            <Chip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />
          ))}
        </View>

        <Button label="Save Changes" onPress={handleSave} style={styles.saveButton} />
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
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

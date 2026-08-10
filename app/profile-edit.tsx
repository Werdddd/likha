import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable, Button, MultiSelectField, SelectField, TextField } from '../components/ui';
import { disciplines, regions } from '../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useSessionStore } from '../store/session-store';
import type { Discipline, ProfileMode, Region } from '../types';

const BIO_MAX_LENGTH = 160;

export default function ProfileEditScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const updateProfile = useSessionStore((s) => s.updateProfile);

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [region, setRegion] = useState<Region>(currentUser.region);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(currentUser.disciplines);
  const [profileMode, setProfileMode] = useState<ProfileMode>(currentUser.profileMode);

  const handleSave = () => {
    updateProfile({ name: name.trim(), bio: bio.trim(), region, disciplines: selectedDisciplines, profileMode });
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Avatar uri={currentUser.avatarUrl} size={88} bordered />
          <Text style={styles.avatarHint}>This photo is visible on your public profile</Text>
        </View>

        <TextField label="Name" value={name} onChangeText={setName} placeholder="Your full name" />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
          multiline
          numberOfLines={3}
          maxLength={BIO_MAX_LENGTH}
          placeholder="Tell people what you make..."
        />
        <Text style={styles.charCount}>
          {bio.length}/{BIO_MAX_LENGTH}
        </Text>

        <MultiSelectField
          label="Disciplines"
          values={selectedDisciplines}
          options={disciplines}
          onChange={(v) => setSelectedDisciplines(v as Discipline[])}
          max={3}
          icon="layers-outline"
          searchPlaceholder="Search disciplines"
        />

        <SelectField
          label="Region"
          value={region}
          options={regions}
          onChange={(v) => setRegion(v as Region)}
          icon="location-outline"
          searchPlaceholder="Search for a city or region"
        />

        <Text style={styles.sectionLabel}>Profile visibility</Text>
        <View style={styles.card}>
          <VisibilityOption
            icon="briefcase-outline"
            title="Open for work"
            description="Let clients know you're available for new projects"
            selected={profileMode === 'open_for_work'}
            onPress={() => setProfileMode('open_for_work')}
          />
          <View style={styles.optionDivider} />
          <VisibilityOption
            icon="images-outline"
            title="Portfolio only"
            description="Just showcase your work, without an availability badge"
            selected={profileMode === 'portfolio'}
            onPress={() => setProfileMode('portfolio')}
          />
        </View>

        <Button
          label="Save Changes"
          onPress={handleSave}
          disabled={selectedDisciplines.length === 0}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function VisibilityOption({
  icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable style={styles.option} onPress={onPress} scaleTo={0.98}>
      <View style={[styles.optionIconWrap, selected && styles.optionIconWrapSelected]}>
        <Ionicons name={icon} size={17} color={selected ? colors.ink : colors.warmBrown} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  charCount: {
    ...t.caption,
    color: colors.warmBrown,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
    marginVertical: spacing.sm,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionIconWrapSelected: {
    backgroundColor: colors.likhaYellow,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  optionDescription: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioSelected: {
    borderColor: colors.ink,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

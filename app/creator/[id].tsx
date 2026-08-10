import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { AnimatedPressable, Button } from '../../components/ui';
import { getCreatorById, getProjectsByCreator } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = getCreatorById(id);
  const [isFollowing, setIsFollowing] = useState(false);
  const insets = useSafeAreaInsets();

  if (!creator) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Creator' }} />
        <Text style={styles.body}>Creator not found.</Text>
      </SafeAreaView>
    );
  }

  const creatorProjects = getProjectsByCreator(creator.id);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader
          creator={creator}
          actions={
            <View style={styles.actionButtons}>
              {creator.profileMode === 'open_for_work' && (
                <Button label="Hire Me" onPress={() => {}} style={styles.hireButton} />
              )}
              <Button
                label={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'ghost' : 'secondary'}
                onPress={() => setIsFollowing((v) => !v)}
              />
            </View>
          }
        />

        <MasonryGrid projects={creatorProjects} onPressProject={(project) => router.push(`/project/${project.id}`)} />
      </ScrollView>

      <AnimatedPressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        scaleTo={0.9}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </AnimatedPressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hireButton: {
    paddingHorizontal: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

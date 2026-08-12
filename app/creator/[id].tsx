import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasonryGrid } from '../../components/MasonryGrid';
import { ProfileHeader } from '../../components/ProfileHeader';
import { AnimatedPressable, Button } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useCreatorStore } from '../../store/creator-store';
import { useMessageStore } from '../../store/message-store';
import { useProjectStore } from '../../store/project-store';

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = useCreatorStore((s) => s.getCreator(id));
  const fetchCreators = useCreatorStore((s) => s.fetchByIds);
  const fetchByCreator = useProjectStore((s) => s.fetchByCreator);
  const projectsById = useProjectStore((s) => s.projectsById);
  const creatorProjects = useMemo(
    () =>
      Object.values(projectsById)
        .filter((p) => p.creatorId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [projectsById, id],
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const insets = useSafeAreaInsets();
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);

  useEffect(() => {
    if (!creator) fetchCreators([id]);
    fetchByCreator(id);
  }, [id, creator, fetchCreators, fetchByCreator]);

  if (!creator) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Creator' }} />
        <Text style={styles.body}>Creator not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader
          creator={creator}
          actions={
            <View style={styles.actionButtons}>
              {creator.profileMode === 'open_for_work' && (
                <Button
                  label="Hire Me"
                  onPress={() => router.push(`/message/${getOrCreateConversation(creator.id)}`)}
                  style={styles.hireButton}
                />
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

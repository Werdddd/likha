import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentsSheet } from '../../components/CommentsSheet';
import { MediaStackCarousel } from '../../components/MediaStackCarousel';
import { ModerationNoteSheet } from '../../components/ModerationNoteSheet';
import { SaveToShelfSheet } from '../../components/SaveToShelfSheet';
import { AnimatedPressable, Avatar } from '../../components/ui';
import { iconForCategory } from '../../constants/category-icons';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { capitalize } from '../../lib/format';
import { useCreatorStore } from '../../store/creator-store';
import { useProjectStore } from '../../store/project-store';
import { useSessionStore } from '../../store/session-store';
import { useShelfStore } from '../../store/shelf-store';
import type { Project } from '../../types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useSessionStore((s) => s.currentUser);
  const currentUserId = currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  const cachedProject = useProjectStore((s) => s.projectsById[id]);
  const fetchById = useProjectStore((s) => s.fetchById);
  const appreciate = useProjectStore((s) => s.appreciate);
  const unappreciate = useProjectStore((s) => s.unappreciate);
  const hasAppreciated = useProjectStore((s) => s.hasAppreciated);
  const moderateProject = useProjectStore((s) => s.moderateProject);
  const adminDeleteProject = useProjectStore((s) => s.adminDeleteProject);
  const creator = useCreatorStore((s) => (cachedProject ? s.getCreator(cachedProject.creatorId) : undefined));
  const isSaved = useShelfStore((s) => !!s.savedProjectIds[id]);

  const [project, setProject] = useState<Project | null | undefined>(cachedProject);
  const [appreciated, setAppreciated] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [noteSheet, setNoteSheet] = useState<'hide' | 'remove' | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const insets = useSafeAreaInsets();

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.96);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    if (cachedProject) {
      setProject(cachedProject);
    } else {
      fetchById(id).then(setProject);
    }
  }, [id, cachedProject, fetchById]);

  useEffect(() => {
    if (!currentUserId) return;
    hasAppreciated(id, currentUserId).then(setAppreciated);
  }, [id, currentUserId, hasAppreciated]);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 320 });
    heroScale.value = withTiming(1, { duration: 320 });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const toggleAppreciate = () => {
    if (!currentUserId) return;
    heartScale.value = withSequence(withSpring(1.3, { duration: 150 }), withSpring(1, { duration: 150 }));
    if (appreciated) {
      setAppreciated(false);
      unappreciate(id, currentUserId);
    } else {
      setAppreciated(true);
      appreciate(id, currentUserId);
    }
  };

  const handleRestore = async () => {
    setIsModerating(true);
    const { error } = await moderateProject(id, 'restore');
    setIsModerating(false);
    if (error) Alert.alert('Could not restore project', error);
  };

  const handleHideConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await moderateProject(id, 'hide', note);
    setIsModerating(false);
    if (error) Alert.alert('Could not hide project', error);
  };

  const handleRemoveConfirm = async (note: string) => {
    setNoteSheet(null);
    setIsModerating(true);
    const { error } = await adminDeleteProject(id, note);
    setIsModerating(false);
    if (error) {
      Alert.alert('Could not remove project', error);
      return;
    }
    router.back();
  };

  if (project === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Project' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Project' }} />
        <Text style={styles.body}>Project not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        <Animated.View style={heroStyle}>
          <MediaStackCarousel media={project.media} />
        </Animated.View>

        <View style={styles.content}>
          {(currentUserId === project.creatorId || isAdmin) && project.moderationStatus === 'rejected' && (
            <View style={styles.moderationBanner}>
              <Ionicons name="eye-off-outline" size={16} color={colors.terracotta} />
              <Text style={styles.moderationBannerText}>
                {project.moderationReason
                  ? `Hidden by an admin: ${project.moderationReason}`
                  : 'Hidden by an admin — not visible to others.'}
              </Text>
            </View>
          )}

          {isAdmin && (
            <View style={styles.adminRow}>
              {project.moderationStatus === 'rejected' ? (
                <AnimatedPressable
                  style={styles.adminButton}
                  scaleTo={0.96}
                  disabled={isModerating}
                  onPress={handleRestore}
                >
                  <Ionicons name="eye-outline" size={14} color={colors.ink} />
                  <Text style={styles.adminButtonLabel}>{isModerating ? 'Working…' : 'Restore'}</Text>
                </AnimatedPressable>
              ) : (
                <AnimatedPressable
                  style={styles.adminButton}
                  scaleTo={0.96}
                  disabled={isModerating}
                  onPress={() => setNoteSheet('hide')}
                >
                  <Ionicons name="eye-off-outline" size={14} color={colors.ink} />
                  <Text style={styles.adminButtonLabel}>Hide</Text>
                </AnimatedPressable>
              )}
              <AnimatedPressable
                style={[styles.adminButton, styles.adminButtonDestructive]}
                scaleTo={0.96}
                disabled={isModerating}
                onPress={() => setNoteSheet('remove')}
              >
                <Ionicons name="trash-outline" size={14} color={colors.terracotta} />
                <Text style={[styles.adminButtonLabel, styles.adminButtonLabelDestructive]}>Remove</Text>
              </AnimatedPressable>
            </View>
          )}

          <Text style={styles.title}>{project.title}</Text>

          {creator && (
            <Link href={`/creator/${creator.id}`} asChild>
              <AnimatedPressable style={styles.creatorRow} scaleTo={0.98}>
                <Avatar uri={creator.avatarUrl} size={40} bordered />
                <View style={styles.creatorTextWrap}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorMeta}>
                    @{creator.handle} · {project.region}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.warmBrown} />
              </AnimatedPressable>
            </Link>
          )}

          <View style={styles.divider} />

          {project.description.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About this project</Text>
              <Text style={styles.description}>{project.description}</Text>
            </View>
          )}

          {project.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Categories</Text>
              <View style={styles.tagRow}>
                {project.categories.map((c) => (
                  <View key={c} style={styles.categoryTag}>
                    <Ionicons name={iconForCategory(c)} size={12} color={colors.ink} />
                    <Text style={styles.categoryTagLabel}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {project.mediums.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mediums</Text>
              <View style={styles.tagRow}>
                {project.mediums.map((m) => (
                  <View key={m} style={styles.mediumTag}>
                    <Text style={styles.mediumTagLabel}>{capitalize(m)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsRow}>
            <AnimatedPressable
              style={[styles.actionButton, appreciated && styles.actionButtonActive]}
              onPress={toggleAppreciate}
              scaleTo={0.94}
            >
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={appreciated ? 'heart' : 'heart-outline'}
                  size={18}
                  color={appreciated ? colors.likhaYellow : colors.ink}
                />
              </Animated.View>
              <Text style={[styles.actionLabel, appreciated && styles.actionLabelActive]}>
                {project.appreciations}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => setCommentsVisible(true)}
              scaleTo={0.94}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.ink} />
              <Text style={styles.actionLabel}>{project.commentCount}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.actionButton, isSaved && styles.actionButtonActive]}
              onPress={() => setSaveSheetVisible(true)}
              scaleTo={0.94}
            >
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color={colors.ink} />
              <Text style={[styles.actionLabel, isSaved && styles.actionLabelActive]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>

      <AnimatedPressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => router.back()}
        scaleTo={0.9}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </AnimatedPressable>

      <CommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        projectId={project.id}
      />

      <SaveToShelfSheet
        visible={saveSheetVisible}
        onClose={() => setSaveSheetVisible(false)}
        projectId={project.id}
      />

      <ModerationNoteSheet
        visible={noteSheet === 'hide'}
        title="Hide this project"
        body="The creator will be notified with your reason. They can still see it themselves; nobody else can."
        confirmLabel="Hide"
        onCancel={() => setNoteSheet(null)}
        onConfirm={handleHideConfirm}
      />
      <ModerationNoteSheet
        visible={noteSheet === 'remove'}
        title="Remove this project"
        body="This permanently deletes it. The creator will be notified with your reason."
        confirmLabel="Remove"
        onCancel={() => setNoteSheet(null)}
        onConfirm={handleRemoveConfirm}
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
  content: {
    padding: spacing.lg,
  },
  moderationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.terracotta + '1a',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  moderationBannerText: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.terracotta,
    flex: 1,
  },
  adminRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  adminButtonDestructive: {
    backgroundColor: colors.terracotta + '1a',
  },
  adminButtonLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  adminButtonLabelDestructive: {
    color: colors.terracotta,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.softGray + '40',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  creatorTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creatorMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 1,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  description: {
    ...t.body,
    color: colors.ink,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.likhaYellow + '33',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  categoryTagLabel: {
    ...t.caption,
    fontFamily: t.bodyMedium.fontFamily,
    color: colors.ink,
  },
  mediumTag: {
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  mediumTagLabel: {
    ...t.caption,
    color: colors.warmBrown,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  actionButtonActive: {
    backgroundColor: colors.likhaYellow + '33',
  },
  actionLabel: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  actionLabelActive: {
    fontFamily: t.h3.fontFamily,
    color: colors.ink,
  },
  backButton: {
    position: 'absolute',
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

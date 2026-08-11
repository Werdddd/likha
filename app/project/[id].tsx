import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentsSheet } from '../../components/CommentsSheet';
import { AnimatedPressable, Avatar } from '../../components/ui';
import { getCreatorById, getProjectById } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useCommentStore } from '../../store/comment-store';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = getProjectById(id);
  const creator = project ? getCreatorById(project.creatorId) : undefined;
  const commentCount = useCommentStore((s) => s.getCommentCount(id));
  const [appreciated, setAppreciated] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.96);
  const heartScale = useSharedValue(1);

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
    setAppreciated((v) => !v);
    heartScale.value = withSequence(withSpring(1.3, { duration: 150 }), withSpring(1, { duration: 150 }));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

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
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {project.media.map((media) => (
              <Image
                key={media.id}
                source={{ uri: media.url }}
                style={{ width, height: width }}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {project.media.length > 1 && (
            <View style={styles.dots}>
              {project.media.map((media, index) => (
                <View key={media.id} style={[styles.dot, index === page && styles.dotActive]} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>{project.title}</Text>

          {creator && (
            <Link href={`/creator/${creator.id}`} asChild>
              <AnimatedPressable style={styles.creatorRow} scaleTo={0.98}>
                <Avatar uri={creator.avatarUrl} size={36} bordered />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorMeta}>{project.region}</Text>
                </View>
              </AnimatedPressable>
            </Link>
          )}

          <Text style={styles.description}>{project.description}</Text>

          <View style={styles.tagRow}>
            <Text style={styles.tag}>{project.category}</Text>
            {project.mediums.map((m) => (
              <Text key={m} style={styles.tag}>
                {m}
              </Text>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <AnimatedPressable style={styles.appreciateButton} onPress={toggleAppreciate} scaleTo={0.9}>
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={appreciated ? 'heart' : 'heart-outline'}
                  size={19}
                  color={appreciated ? colors.terracotta : colors.ink}
                />
              </Animated.View>
              <Text style={styles.appreciateLabel}>
                {project.appreciations + (appreciated ? 1 : 0)} Appreciations
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.appreciateButton}
              onPress={() => setCommentsVisible(true)}
              scaleTo={0.9}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.ink} />
              <Text style={styles.appreciateLabel}>{commentCount} Comments</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white + '80',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creatorMeta: {
    ...t.caption,
    color: colors.warmBrown,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tag: {
    ...t.caption,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  appreciateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appreciateLabel: {
    ...t.bodyMedium,
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

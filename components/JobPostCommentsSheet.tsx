import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow, spacing, type as t } from '../constants/theme';
import { timeAgo } from '../lib/format';
import { useCreatorStore } from '../store/creator-store';
import { useJobPostCommentStore } from '../store/job-post-comment-store';
import { useSessionStore } from '../store/session-store';
import type { JobPostComment } from '../types';
import { AnimatedPressable, Avatar } from './ui';

interface JobPostCommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  jobPostId: string;
}

const EMPTY_COMMENTS: JobPostComment[] = [];

export function JobPostCommentsSheet({ visible, onClose, jobPostId }: JobPostCommentsSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.55;
  const insets = useSafeAreaInsets();

  const currentUser = useSessionStore((s) => s.currentUser);
  const commentList = useJobPostCommentStore((s) => s.commentsByJobPost[jobPostId] ?? EMPTY_COMMENTS);
  const fetchComments = useJobPostCommentStore((s) => s.fetchComments);
  const addComment = useJobPostCommentStore((s) => s.addComment);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) fetchComments(jobPostId);
  }, [visible, jobPostId, fetchComments]);

  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(0.45, { duration: 280 });
    }
  }, [visible, sheetHeight, translateY, backdropOpacity]);

  const closeAnimated = () => {
    'worklet';
    translateY.value = withTiming(sheetHeight, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight * 0.25 || e.velocityY > 800) {
        closeAnimated();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(jobPostId, currentUser.id, text);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const openCreator = (creatorId: string) => {
    onClose();
    router.push(`/creator/${creatorId}`);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeAnimated}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAnimated} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight }, panelStyle]}>
        <GestureDetector gesture={dragGesture}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {commentList.length === 0 ? (
              <Text style={styles.empty}>No comments yet. Ask a question to get things started.</Text>
            ) : (
              commentList.map((comment) => (
                <CommentRow key={comment.id} comment={comment} onPressCreator={openCreator} />
              ))
            )}
          </ScrollView>

          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <Avatar uri={currentUser.avatarUrl} size={32} />
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask a question or clarify scope..."
              placeholderTextColor={colors.warmBrown}
              multiline
            />
            <AnimatedPressable
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!draft.trim()}
              scaleTo={0.9}
            >
              <Ionicons name="arrow-up" size={18} color={colors.ink} />
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

function CommentRow({
  comment,
  onPressCreator,
}: {
  comment: JobPostComment;
  onPressCreator: (creatorId: string) => void;
}) {
  const creator = useCreatorStore((s) => s.getCreator(comment.creatorId));
  if (!creator) return null;

  return (
    <View style={styles.commentRow}>
      <AnimatedPressable scaleTo={0.95} onPress={() => onPressCreator(creator.id)}>
        <Avatar uri={creator.avatarUrl} size={36} />
      </AnimatedPressable>
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{creator.name}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
        <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow.lg,
  },
  flex: {
    flex: 1,
  },
  dragArea: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray,
    alignSelf: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  empty: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentBody: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentAuthor: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 2,
  },
  commentText: {
    ...t.body,
    color: colors.ink,
  },
  commentTime: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 4,
    marginLeft: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.softGray,
  },
  input: {
    ...t.body,
    ...(Platform.OS === 'ios' ? { lineHeight: undefined } : null),
    flex: 1,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

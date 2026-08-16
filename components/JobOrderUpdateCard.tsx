import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, shadow, spacing, type as t } from '../constants/theme';
import { timeAgo } from '../lib/format';
import { getSignedUrl } from '../lib/upload';
import { useCreatorStore } from '../store/creator-store';
import { useJobOrderUpdateStore } from '../store/job-order-update-store';
import type { JobOrderUpdate, JobOrderUpdateComment } from '../types';
import { ImagePreviewModal } from './ImagePreviewModal';
import { AnimatedPressable, Avatar } from './ui';

const ATTACHMENTS_BUCKET = 'job-order-update-attachments';

interface JobOrderUpdateCardProps {
  update: JobOrderUpdate;
  jobOrderId: string;
  currentUserId: string;
}

const EMPTY_COMMENTS: JobOrderUpdateComment[] = [];

export function JobOrderUpdateCard({ update, jobOrderId, currentUserId }: JobOrderUpdateCardProps) {
  const author = useCreatorStore((s) => s.getCreator(update.creatorId));
  const comments = useJobOrderUpdateStore((s) => s.commentsByUpdate[update.id] ?? EMPTY_COMMENTS);
  const isLoadingComments = useJobOrderUpdateStore((s) => s.isLoadingComments[update.id] ?? false);
  const fetchComments = useJobOrderUpdateStore((s) => s.fetchComments);
  const addComment = useJobOrderUpdateStore((s) => s.addComment);

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  useEffect(() => {
    if (update.imagePaths.length === 0) return;
    let cancelled = false;
    Promise.all(update.imagePaths.map((path) => getSignedUrl(ATTACHMENTS_BUCKET, path))).then((urls) => {
      if (!cancelled) setImageUrls(urls.filter((url): url is string => url !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [update.imagePaths]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) fetchComments(update.id);
  };

  const handleOpenFile = async () => {
    if (!update.filePath) return;
    setIsOpeningFile(true);
    const url = await getSignedUrl(ATTACHMENTS_BUCKET, update.filePath);
    setIsOpeningFile(false);
    if (url) Linking.openURL(url);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setIsSending(true);
    await addComment(jobOrderId, update.id, currentUserId, text);
    setIsSending(false);
    setDraft('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={author?.avatarUrl ?? ''} size={30} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{author?.name ?? 'Creator'}</Text>
          <Text style={styles.time}>{timeAgo(update.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.body}>{update.body}</Text>

      {imageUrls.length > 0 && (
        <View style={styles.imageRow}>
          {imageUrls.map((url) => (
            <AnimatedPressable key={url} scaleTo={0.96} onPress={() => setPreviewUrl(url)}>
              <Image source={{ uri: url }} style={styles.imageThumb} contentFit="cover" />
            </AnimatedPressable>
          ))}
        </View>
      )}

      {update.fileName && (
        <AnimatedPressable style={styles.fileRow} scaleTo={0.98} onPress={handleOpenFile} disabled={isOpeningFile}>
          {isOpeningFile ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <Ionicons name="document-attach-outline" size={16} color={colors.ink} />
          )}
          <Text style={styles.fileName} numberOfLines={1}>
            {update.fileName}
          </Text>
        </AnimatedPressable>
      )}

      <AnimatedPressable style={styles.toggle} scaleTo={0.97} onPress={handleToggle}>
        <Ionicons name="chatbubble-outline" size={13} color={colors.warmBrown} />
        <Text style={styles.toggleLabel}>
          {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'}` : 'Comment'}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.warmBrown} />
      </AnimatedPressable>

      {expanded && (
        <View style={styles.thread}>
          {isLoadingComments ? (
            <ActivityIndicator size="small" color={colors.warmBrown} style={styles.threadLoading} />
          ) : (
            comments.map((comment) => <CommentRow key={comment.id} creatorId={comment.creatorId} text={comment.text} createdAt={comment.createdAt} />)
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a comment..."
              placeholderTextColor={colors.warmBrown}
              multiline
            />
            <AnimatedPressable
              style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!draft.trim() || isSending}
              scaleTo={0.9}
            >
              <Ionicons name="arrow-up" size={15} color={colors.ink} />
            </AnimatedPressable>
          </View>
        </View>
      )}

      <ImagePreviewModal visible={!!previewUrl} uri={previewUrl} onClose={() => setPreviewUrl(null)} />
    </View>
  );
}

function CommentRow({ creatorId, text, createdAt }: { creatorId: string; text: string; createdAt: string }) {
  const creator = useCreatorStore((s) => s.getCreator(creatorId));
  return (
    <View style={styles.commentRow}>
      <Avatar uri={creator?.avatarUrl ?? ''} size={22} />
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.commentAuthor}>{creator?.name ?? 'User'} </Text>
          {text}
        </Text>
        <Text style={styles.commentTime}>{timeAgo(createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  time: {
    ...t.caption,
    color: colors.warmBrown,
  },
  body: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  fileName: {
    ...t.caption,
    color: colors.ink,
    flexShrink: 1,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  toggleLabel: {
    ...t.caption,
    color: colors.warmBrown,
  },
  thread: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  threadLoading: {
    marginVertical: spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  commentBody: {
    flex: 1,
  },
  commentText: {
    ...t.body,
    color: colors.ink,
  },
  commentAuthor: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  commentTime: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    ...t.body,
    ...(Platform.OS === 'ios' ? { lineHeight: undefined } : null),
    flex: 1,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    maxHeight: 80,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

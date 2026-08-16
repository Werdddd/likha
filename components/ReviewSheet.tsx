import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useReviewStore } from '../store/review-store';
import type { Review } from '../types';
import { StarRatingInput } from './StarRating';
import { Button } from './ui';

interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  orderItemId: string;
  listingId: string;
  creatorId: string;
  buyerId: string;
  itemTitle: string;
  itemCoverUrl: string;
  existingReview?: Review;
}

export function ReviewSheet({
  visible,
  onClose,
  orderItemId,
  listingId,
  creatorId,
  buyerId,
  itemTitle,
  itemCoverUrl,
  existingReview,
}: ReviewSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.6;
  const insets = useSafeAreaInsets();

  const addReview = useReviewStore((s) => s.addReview);
  const editReview = useReviewStore((s) => s.editReview);
  const deleteReview = useReviewStore((s) => s.deleteReview);

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [body, setBody] = useState(existingReview?.body ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating ?? 0);
      setBody(existingReview?.body ?? '');
    }
  }, [visible, existingReview]);

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

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Pick a rating', 'Tap a star from 1 to 5 before submitting.');
      return;
    }

    setIsSubmitting(true);
    const { error } = existingReview
      ? await editReview(existingReview.id, listingId, { rating, body: body.trim() })
      : await addReview({ orderItemId, listingId, creatorId, buyerId, rating, body: body.trim() });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Could not submit review', error);
      return;
    }
    closeAnimated();
  };

  const handleDelete = () => {
    if (!existingReview) return;
    Alert.alert('Delete this review?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          const { error } = await deleteReview(existingReview.id, orderItemId, listingId);
          setIsDeleting(false);
          if (error) Alert.alert('Could not delete review', error);
          else closeAnimated();
        },
      },
    ]);
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemRow}>
              <Image source={{ uri: itemCoverUrl }} style={styles.itemThumb} contentFit="cover" />
              <Text style={styles.itemTitle} numberOfLines={2}>
                {itemTitle}
              </Text>
            </View>

            <Text style={styles.label}>Your rating</Text>
            <StarRatingInput value={rating} onChange={setRating} size={36} />

            <Text style={styles.label}>Your review (optional)</Text>
            <TextInput
              style={styles.input}
              value={body}
              onChangeText={setBody}
              placeholder="How was this item?"
              placeholderTextColor={colors.warmBrown}
              multiline
            />

            <Button
              label={isSubmitting ? 'Submitting…' : existingReview ? 'Save Changes' : 'Post Review'}
              onPress={handleSubmit}
              disabled={isSubmitting || isDeleting}
              style={styles.submitButton}
            />

            {existingReview && (
              <Pressable onPress={handleDelete} disabled={isSubmitting || isDeleting} style={styles.deleteButton}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.terracotta} />
                ) : (
                  <Text style={styles.deleteButtonLabel}>Delete review</Text>
                )}
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  itemTitle: {
    ...t.bodyMedium,
    color: colors.ink,
    flex: 1,
  },
  label: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    ...t.body,
    ...(Platform.OS === 'ios' ? { lineHeight: undefined } : null),
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  deleteButtonLabel: {
    ...t.label,
    color: colors.terracotta,
  },
});

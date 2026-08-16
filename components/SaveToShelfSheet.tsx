import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useSessionStore } from '../store/session-store';
import { useShelfStore } from '../store/shelf-store';
import type { Shelf } from '../types';
import { AnimatedPressable } from './ui';

interface SaveToShelfSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Exactly one of these identifies what's being saved. */
  listingId?: string;
  projectId?: string;
}

export function SaveToShelfSheet({ visible, onClose, listingId, projectId }: SaveToShelfSheetProps) {
  const insets = useSafeAreaInsets();
  const currentUserId = useSessionStore((s) => s.currentUser.id);

  const shelvesById = useShelfStore((s) => s.shelvesById);
  const fetchMyShelves = useShelfStore((s) => s.fetchMyShelves);
  const createShelf = useShelfStore((s) => s.createShelf);
  const fetchShelvesContainingListing = useShelfStore((s) => s.fetchShelvesContainingListing);
  const fetchShelvesContainingProject = useShelfStore((s) => s.fetchShelvesContainingProject);
  const saveListingToShelf = useShelfStore((s) => s.saveListingToShelf);
  const removeListingFromShelf = useShelfStore((s) => s.removeListingFromShelf);
  const saveProjectToShelf = useShelfStore((s) => s.saveProjectToShelf);
  const removeProjectFromShelf = useShelfStore((s) => s.removeProjectFromShelf);

  const [memberShelfIds, setMemberShelfIds] = useState<Set<string>>(new Set());
  const [pendingShelfId, setPendingShelfId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  const myShelves = Object.values(shelvesById)
    .filter((shelf) => shelf.ownerId === currentUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!visible || !currentUserId) return;
    fetchMyShelves(currentUserId);
    const fetchMembership = listingId ? fetchShelvesContainingListing(listingId) : fetchShelvesContainingProject(projectId!);
    fetchMembership.then(setMemberShelfIds);
  }, [visible, currentUserId, listingId, projectId, fetchMyShelves, fetchShelvesContainingListing, fetchShelvesContainingProject]);

  const height = 400;

  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(0.45, { duration: 280 });
    } else {
      setCreating(false);
      setNewShelfName('');
    }
  }, [visible, translateY, backdropOpacity]);

  // The sheet is a fixed-height, absolutely-positioned panel rather than a full-screen view, so
  // KeyboardAvoidingView can't reliably measure its offset from the keyboard. Instead, track the
  // keyboard height directly and shift the whole panel up by that amount.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, { duration: e.duration || 220 });
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      keyboardOffset.value = withTiming(0, { duration: e.duration || 220 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  const closeAnimated = () => {
    'worklet';
    translateY.value = withTiming(height, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > height * 0.25 || e.velocityY > 800) {
        closeAnimated();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardOffset.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const toggleShelf = async (shelf: Shelf) => {
    setPendingShelfId(shelf.id);
    const isMember = memberShelfIds.has(shelf.id);
    if (listingId) {
      await (isMember ? removeListingFromShelf(shelf.id, listingId) : saveListingToShelf(shelf.id, listingId));
    } else if (projectId) {
      await (isMember ? removeProjectFromShelf(shelf.id, projectId) : saveProjectToShelf(shelf.id, projectId));
    }
    setPendingShelfId(null);
    setMemberShelfIds((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(shelf.id);
      else next.add(shelf.id);
      return next;
    });
  };

  const handleCreateShelf = async () => {
    const name = newShelfName.trim();
    if (!name || !currentUserId) return;
    setCreating(true);
    const { shelf } = await createShelf(currentUserId, name);
    if (shelf) {
      await toggleShelf(shelf);
      setNewShelfName('');
    }
    setCreating(false);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeAnimated}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAnimated} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height }, panelStyle]}>
        <GestureDetector gesture={dragGesture}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <Text style={styles.title}>Save to Shelf</Text>

        <View style={styles.flex}>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {myShelves.length === 0 && (
              <Text style={styles.empty}>You don't have any shelves yet — create one below.</Text>
            )}
            {myShelves.map((shelf) => {
              const isMember = memberShelfIds.has(shelf.id);
              const isPending = pendingShelfId === shelf.id;
              return (
                <AnimatedPressable
                  key={shelf.id}
                  style={styles.shelfRow}
                  onPress={() => toggleShelf(shelf)}
                  disabled={isPending}
                  scaleTo={0.98}
                >
                  <View style={styles.shelfIconWrap}>
                    <Ionicons name="library-outline" size={18} color={colors.warmBrown} />
                  </View>
                  <View style={styles.shelfTextWrap}>
                    <Text style={styles.shelfName}>{shelf.name}</Text>
                    <Text style={styles.shelfMeta}>
                      {shelf.itemCount} item{shelf.itemCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Ionicons
                    name={isMember ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isMember ? colors.golden : colors.softGray}
                  />
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View style={[styles.createBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <TextInput
              style={styles.createInput}
              value={newShelfName}
              onChangeText={setNewShelfName}
              placeholder="New shelf name..."
              placeholderTextColor={colors.warmBrown}
              onSubmitEditing={handleCreateShelf}
              returnKeyType="done"
            />
            <AnimatedPressable
              style={[styles.createButton, !newShelfName.trim() && styles.createButtonDisabled]}
              onPress={handleCreateShelf}
              disabled={!newShelfName.trim() || creating}
              scaleTo={0.9}
            >
              <Ionicons name="add" size={20} color={colors.ink} />
            </AnimatedPressable>
          </View>
        </View>
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
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray,
    alignSelf: 'center',
  },
  title: {
    ...t.h3,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
    marginTop: spacing.lg,
  },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  shelfIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.softGray + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfTextWrap: {
    flex: 1,
  },
  shelfName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  shelfMeta: {
    ...t.caption,
    color: colors.warmBrown,
  },
  createBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.softGray,
  },
  createInput: {
    ...t.body,
    flex: 1,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
});

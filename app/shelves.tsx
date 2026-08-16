import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Card } from '../components/ui';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { useSessionStore } from '../store/session-store';
import { useShelfStore } from '../store/shelf-store';

export default function ShelvesScreen() {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const shelvesById = useShelfStore((s) => s.shelvesById);
  const fetchMyShelves = useShelfStore((s) => s.fetchMyShelves);
  const createShelf = useShelfStore((s) => s.createShelf);
  const deleteShelf = useShelfStore((s) => s.deleteShelf);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  useEffect(() => {
    if (currentUserId) fetchMyShelves(currentUserId);
  }, [currentUserId, fetchMyShelves]);

  const onRefresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    await fetchMyShelves(currentUserId);
    setRefreshing(false);
  }, [currentUserId, fetchMyShelves]);

  const myShelves = Object.values(shelvesById)
    .filter((shelf) => shelf.ownerId === currentUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleCreate = async () => {
    const name = newShelfName.trim();
    if (!name || !currentUserId) return;
    setCreating(true);
    const { error } = await createShelf(currentUserId, name);
    setCreating(false);
    if (error) {
      Alert.alert('Could not create shelf', error);
      return;
    }
    setNewShelfName('');
  };

  const handleDelete = (shelfId: string, name: string) => {
    Alert.alert(`Delete "${name}"?`, 'This removes the shelf. Saved items themselves are not deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteShelf(shelfId);
          if (error) Alert.alert('Could not delete shelf', error);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'My Shelves' }} />

      <View style={styles.createRow}>
        <TextInput
          style={styles.createInput}
          value={newShelfName}
          onChangeText={setNewShelfName}
          placeholder="New shelf name..."
          placeholderTextColor={colors.warmBrown}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <AnimatedPressable
          style={[styles.createButton, !newShelfName.trim() && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!newShelfName.trim() || creating}
          scaleTo={0.9}
        >
          <Ionicons name="add" size={20} color={colors.ink} />
        </AnimatedPressable>
      </View>

      {myShelves.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="library-outline" size={32} color={colors.warmBrown} />
          </View>
          <Text style={styles.emptyTitle}>No shelves yet</Text>
          <Text style={styles.emptyBody}>Tap the bookmark icon on any listing or project to save it to a shelf.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          {myShelves.map((shelf) => (
            <Card key={shelf.id} style={styles.card}>
              <AnimatedPressable onPress={() => router.push(`/shelf/${shelf.id}`)} scaleTo={0.98} style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="library-outline" size={20} color={colors.warmBrown} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.shelfName}>{shelf.name}</Text>
                  <Text style={styles.shelfMeta}>
                    {shelf.itemCount} item{shelf.itemCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.warmBrown} />
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.deleteButton}
                onPress={() => handleDelete(shelf.id, shelf.name)}
                scaleTo={0.9}
              >
                <Ionicons name="trash-outline" size={16} color={colors.terracotta} />
              </AnimatedPressable>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.softGray + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  shelfName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  shelfMeta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingGrid } from '../../components/ListingGrid';
import { MasonryGrid } from '../../components/MasonryGrid';
import { colors, spacing, type as t } from '../../constants/theme';
import { useCreatorStore } from '../../store/creator-store';
import { useListingStore } from '../../store/listing-store';
import { useProjectStore } from '../../store/project-store';
import { useShelfStore } from '../../store/shelf-store';

export default function ShelfDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const shelf = useShelfStore((s) => s.shelvesById[id]);
  const fetchShelfItems = useShelfStore((s) => s.fetchShelfItems);
  const listingIds = useShelfStore((s) => s.listingIdsByShelf[id]);
  const projectIds = useShelfStore((s) => s.projectIdsByShelf[id]);

  const listingsById = useListingStore((s) => s.listingsById);
  const projectsById = useProjectStore((s) => s.projectsById);
  const getCreator = useCreatorStore((s) => s.getCreator);

  useEffect(() => {
    fetchShelfItems(id);
  }, [id, fetchShelfItems]);

  const isLoading = listingIds === undefined || projectIds === undefined;
  const listings = (listingIds ?? []).map((lid) => listingsById[lid]).filter((l) => !!l);
  const projects = (projectIds ?? []).map((pid) => projectsById[pid]).filter((p) => !!p);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: shelf?.name ?? 'Shelf' }} />

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      ) : listings.length === 0 && projects.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={32} color={colors.warmBrown} />
          <Text style={styles.emptyTitle}>Nothing saved here yet</Text>
          <Text style={styles.emptyBody}>Tap the bookmark icon on a listing or project to add it to this shelf.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {listings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Products</Text>
              <ListingGrid
                listings={listings}
                getCreator={getCreator}
                onPressListing={(listing) => router.push(`/listing/${listing.id}`)}
              />
            </View>
          )}
          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Projects</Text>
              <MasonryGrid
                projects={projects}
                getCreator={getCreator}
                onPressProject={(project) => router.push(`/project/${project.id}`)}
              />
            </View>
          )}
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
  loading: {
    marginTop: spacing.xl,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...t.label,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.warmBrown,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
  },
});

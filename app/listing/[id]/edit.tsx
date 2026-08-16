import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingForm, type ListingFormValues } from '../../../components/ListingForm';
import { Button } from '../../../components/ui';
import { colors, spacing, type as t } from '../../../constants/theme';
import { useListingStore } from '../../../store/listing-store';
import { useSessionStore } from '../../../store/session-store';
import type { Listing } from '../../../types';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const cachedListing = useListingStore((s) => s.listingsById[id]);
  const fetchById = useListingStore((s) => s.fetchById);
  const updateListing = useListingStore((s) => s.updateListing);
  const setListingActive = useListingStore((s) => s.setListingActive);
  const deleteListing = useListingStore((s) => s.deleteListing);

  const [listing, setListing] = useState<Listing | null | undefined>(cachedListing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (cachedListing) {
      setListing(cachedListing);
      return;
    }
    fetchById(id).then(setListing);
  }, [id, cachedListing, fetchById]);

  const handleSubmit = async (values: ListingFormValues) => {
    setIsSubmitting(true);
    const { listing: updated, error } = await updateListing(id, {
      title: values.title,
      description: values.description,
      price: values.price,
      category: values.category,
      tags: [],
      stock: values.stock,
      projectId: values.projectId,
      imageUrls: values.images,
      digitalFilePath: values.digitalFilePath,
      digitalFileName: values.digitalFileName,
      links: values.links,
    });
    setIsSubmitting(false);

    if (!updated) {
      Alert.alert('Could not save changes', error ?? 'Please try again.');
      return;
    }
    router.back();
  };

  const handleToggleActive = async () => {
    if (!listing) return;
    const nextActive = !listing.isActive;
    setIsTogglingActive(true);
    const { error } = await setListingActive(listing.id, nextActive);
    setIsTogglingActive(false);
    if (error) {
      Alert.alert('Could not update listing', error);
      return;
    }
    setListing({ ...listing, isActive: nextActive });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this listing?',
      'This permanently removes it from your shop. Past orders keep a snapshot of what was purchased, so this won’t affect order history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteListing(id);
            setIsDeleting(false);
            if (error) {
              Alert.alert('Could not delete listing', error);
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  if (listing === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Listing' }} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!listing || listing.creatorId !== currentUserId) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Edit Listing' }} />
        <Text style={styles.body}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Edit Listing' }} />
      <ListingForm
        initialValues={{
          title: listing.title,
          description: listing.description,
          price: listing.price,
          productType: listing.productType,
          category: listing.category,
          stock: listing.stock,
          projectId: listing.projectId,
          images: listing.images,
          digitalFilePath: listing.digitalFilePath,
          digitalFileName: listing.digitalFileName,
          links: listing.links.map((link) => ({ label: link.label, url: link.url })),
        }}
        lockProductType
        submitLabel={isSubmitting ? 'Saving…' : 'Save Changes'}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <View style={styles.footer}>
        <Button
          label={
            listing.isActive
              ? isTogglingActive
                ? 'Deactivating…'
                : 'Deactivate listing'
              : isTogglingActive
                ? 'Reactivating…'
                : 'Reactivate listing'
          }
          variant="secondary"
          disabled={isTogglingActive || isDeleting}
          onPress={handleToggleActive}
          style={styles.footerButton}
        />
        <Button
          label={isDeleting ? 'Deleting…' : 'Delete listing'}
          variant="ghost"
          disabled={isDeleting || isTogglingActive}
          onPress={handleDelete}
          style={styles.footerButton}
        />
      </View>
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
  body: {
    ...t.body,
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.softGray,
  },
  footerButton: {
    alignSelf: 'stretch',
  },
});

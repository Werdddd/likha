import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingForm, type ListingFormValues } from '../../components/ListingForm';
import { colors } from '../../constants/theme';
import { useListingStore } from '../../store/listing-store';
import { useSessionStore } from '../../store/session-store';

export default function NewListingScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const createListing = useListingStore((s) => s.createListing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ListingFormValues) => {
    setIsSubmitting(true);
    const { listing, error } = await createListing(currentUser.id, {
      title: values.title,
      description: values.description,
      price: values.price,
      productType: values.productType,
      category: values.category,
      tags: [],
      stock: values.stock,
      projectId: values.projectId,
      imageUrls: values.images,
      digitalFilePath: values.digitalFilePath,
      digitalFileName: values.digitalFileName,
    });
    setIsSubmitting(false);

    if (!listing) {
      Alert.alert('Could not publish listing', error ?? 'Please try again.');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'New Listing' }} />
      <ListingForm submitLabel="Publish Listing" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

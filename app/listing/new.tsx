import { router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingForm } from '../../components/ListingForm';
import { colors } from '../../constants/theme';

export default function NewListingScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'New Listing' }} />
      <ListingForm
        submitLabel="Publish Listing"
        onSubmit={() => {
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});

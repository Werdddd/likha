import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { colors, spacing, type as t } from '../../constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://picsum.photos/seed/likha-welcome/900/900' }}
          style={styles.heroImage}
          contentFit="cover"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.wordmark}>Likha</Text>
        <Text style={styles.tagline}>
          Made by Filipinos. Create. Showcase. Get discovered.
        </Text>
        <View style={styles.linkRow}>
          <Link href="/(auth)/sign-up" asChild>
            <Button label="Create account" />
          </Link>
          <Link href="/(auth)/log-in" asChild>
            <Button label="Log in" variant="secondary" />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  hero: {
    height: '48%',
    backgroundColor: colors.softGray,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  wordmark: {
    ...t.display,
    color: colors.ink,
  },
  tagline: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  linkRow: {
    gap: spacing.sm,
  },
});

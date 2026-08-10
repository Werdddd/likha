import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';

const features: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { icon: 'people-outline', label: 'Share\nyour work' },
  { icon: 'compass-outline', label: 'Discover\ninspiration' },
  { icon: 'chatbubble-outline', label: 'Connect\nwith creatives' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <AnimatedPressable onPress={() => router.replace('/(auth)/log-in')} scaleTo={0.95}>
          <Text style={styles.skip}>Skip</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Where creativity 
          <Text style={styles.titleAccent}> comes to life.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Share your ideas, discover original creations, and connect with a creative community.
        </Text>

        <View style={styles.heroWrap}>
          <Image
            source={require('../../assets/likha-avatar.png')}
            style={styles.heroImage}
            contentFit="contain"
          />
        </View>

        <View style={styles.featureRow}>
          {features.map((feature) => (
            <View key={feature.icon} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={colors.ink} />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Link href="/(auth)/sign-up" asChild>
          <Button label="Get Started" />
        </Link>
        <Link href="/(auth)/log-in" style={styles.footerLink}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerTextAccent}>Log In</Text>
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  skip: {
    ...t.bodyMedium,
    color: colors.golden,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  titleAccent: {
    color: colors.likhaYellow,
  },
  subtitle: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: spacing.sm,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: {
    ...t.caption,
    color: colors.warmBrown,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footerLink: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  footerText: {
    ...t.bodyMedium,
    color: colors.warmBrown,
  },
  footerTextAccent: {
    color: colors.golden,
  },
});

import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';
import type { ProfileMode } from '../../types';

const options: Array<{ mode: ProfileMode; title: string; description: string }> = [
  {
    mode: 'portfolio',
    title: 'Portfolio only',
    description: 'Showcase your work and build a following. No selling — great for students and hobbyists.',
  },
  {
    mode: 'open_for_work',
    title: 'Open for work',
    description: 'Everything in Portfolio, plus shop listings, commissions, rates, and a "Hire Me" button.',
  },
];

export default function OnboardingModeScreen() {
  const profileMode = useSessionStore((s) => s.currentUser.profileMode);
  const setProfileMode = useSessionStore((s) => s.setProfileMode);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>How will you use Likha?</Text>
        <Text style={styles.subtitle}>You can change this anytime from your profile.</Text>

        {options.map((option) => {
          const selected = profileMode === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setProfileMode(option.mode)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>{option.title}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </Pressable>
          );
        })}

        <Button
          label="Continue"
          onPress={() => router.push('/(auth)/onboarding-profile')}
          style={styles.continueButton}
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  subtitle: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  cardSelected: {
    borderColor: colors.likhaYellow,
    backgroundColor: '#FFFCF2',
  },
  cardTitle: {
    ...t.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  cardTitleSelected: {
    color: colors.ink,
  },
  cardDescription: {
    ...t.body,
    color: colors.warmBrown,
  },
  continueButton: {
    marginTop: spacing.md,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Avatar, Button, TextField } from '../../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { pickAndUploadImage } from '../../lib/upload';
import { useSessionStore } from '../../store/session-store';

export default function OnboardingAvatarScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const updateProfile = useSessionStore((s) => s.updateProfile);

  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(currentUser.coverUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickAvatar = async () => {
    setIsUploadingAvatar(true);
    const url = await pickAndUploadImage('profile-media', currentUser.id, 'avatar');
    setIsUploadingAvatar(false);
    if (url) setAvatarUrl(url);
  };

  const handlePickCover = async () => {
    setIsUploadingCover(true);
    const url = await pickAndUploadImage('profile-media', currentUser.id, 'cover');
    setIsUploadingCover(false);
    if (url) setCoverUrl(url);
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await updateProfile({ name: name.trim(), avatarUrl, coverUrl });
    setIsSubmitting(false);
    router.push('/(auth)/onboarding-profile');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Add a banner, a photo, and your name so people recognize you on Likha.</Text>

        <AnimatedPressable onPress={handlePickCover} scaleTo={0.98} style={styles.coverWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]} />
          )}
          <View style={styles.editBadge}>
            {isUploadingCover ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Ionicons name="camera-outline" size={14} color={colors.ink} />
            )}
          </View>
        </AnimatedPressable>

        <View style={styles.avatarSection}>
          <AnimatedPressable onPress={handlePickAvatar} scaleTo={0.94} style={styles.avatarPressable}>
            <Avatar uri={avatarUrl} size={104} bordered />
            <View style={[styles.editBadge, styles.avatarEditBadge]}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <Ionicons name="camera-outline" size={16} color={colors.ink} />
              )}
            </View>
          </AnimatedPressable>
        </View>

        <TextField label="Name" value={name} onChangeText={setName} placeholder="Your full name" />

        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!name.trim() || isSubmitting}
          style={styles.continueButton}
        />
        <AnimatedPressable onPress={() => router.push('/(auth)/onboarding-profile')} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
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
  coverWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  coverImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.softGray,
  },
  coverPlaceholder: {
    backgroundColor: colors.softGray,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarPressable: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  avatarEditBadge: {
    width: 32,
    height: 32,
    right: -2,
    bottom: -2,
  },
  continueButton: {
    marginTop: spacing.md,
  },
  skip: {
    alignSelf: 'center',
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  skipText: {
    ...t.body,
    color: colors.warmBrown,
  },
});

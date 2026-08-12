import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button, TextField } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function LogInScreen() {
  const logIn = useSessionStore((s) => s.logIn);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    const { error } = await logIn(identifier.trim(), password);
    setIsSubmitting(false);
    if (error) {
      Alert.alert('Log in failed', error);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AnimatedPressable onPress={() => router.back()} scaleTo={0.9} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </AnimatedPressable>

          <View style={styles.header}>
            <Image
              source={require('../../assets/likha-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Log in to continue your creative journey.</Text>
          </View>

          <TextField
            label="Email or Username"
            placeholder="Enter your email or username"
            autoCapitalize="none"
            keyboardType="email-address"
            leadingIcon="mail-outline"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <TextField
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            leadingIcon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            rightElement={
              <AnimatedPressable onPress={() => setShowPassword((v) => !v)} scaleTo={0.9}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.warmBrown} />
              </AnimatedPressable>
            }
          />

          <Text style={styles.forgotPassword}>Forgot password?</Text>

          <Button label="Log In" onPress={handleSubmit} disabled={!canSubmit} style={styles.submit} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.oauthRow}>
            <AnimatedPressable style={styles.oauthButton} scaleTo={0.97}>
              <Ionicons name="logo-google" size={18} color={colors.ink} />
              <Text style={styles.oauthLabel}>Continue with Google</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.oauthButton} scaleTo={0.97}>
              <Ionicons name="logo-apple" size={20} color={colors.ink} />
              <Text style={styles.oauthLabel}>Continue with Apple</Text>
            </AnimatedPressable>
          </View>

          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            <Text style={styles.footerText}>
              Don&apos;t have an account? <Text style={styles.footerTextAccent}>Sign up</Text>
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 140,
    height: 56,
    marginBottom: spacing.md,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  subtitle: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  forgotPassword: {
    ...t.bodyMedium,
    color: colors.golden,
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.softGray,
  },
  dividerText: {
    ...t.caption,
    color: colors.warmBrown,
    marginHorizontal: spacing.sm,
  },
  oauthRow: {
    gap: spacing.sm,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 4,
  },
  oauthLabel: {
    ...t.button,
    color: colors.ink,
  },
  footerLink: {
    marginTop: spacing.lg,
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

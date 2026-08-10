import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button, TextField } from '../../components/ui';
import { colors, radius, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function SignUpScreen() {
  const signUp = useSessionStore((s) => s.signUp);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreedToTerms;

  const handleSubmit = () => {
    if (!canSubmit) return;
    signUp(name.trim(), email.trim());
    router.push('/(auth)/onboarding-mode');
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join Likha and start sharing your creativity today.</Text>
          </View>

          <TextField
            label="Full Name"
            placeholder="Enter your full name"
            leadingIcon="person-outline"
            value={name}
            onChangeText={setName}
          />
          <TextField
            label="Username"
            placeholder="Choose a username"
            autoCapitalize="none"
            leadingIcon="at-outline"
            value={username}
            onChangeText={setUsername}
          />
          <TextField
            label="Email"
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            leadingIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            placeholder="Create a password"
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
          <TextField
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            leadingIcon="lock-closed-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            rightElement={
              <AnimatedPressable onPress={() => setShowConfirmPassword((v) => !v)} scaleTo={0.9}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.warmBrown} />
              </AnimatedPressable>
            }
          />

          <AnimatedPressable
            style={styles.termsRow}
            scaleTo={0.98}
            onPress={() => setAgreedToTerms((v) => !v)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color={colors.ink} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsAccent}>Terms of Service</Text> and{' '}
              <Text style={styles.termsAccent}>Privacy Policy</Text>.
            </Text>
          </AnimatedPressable>

          <Button label="Sign Up" onPress={handleSubmit} disabled={!canSubmit} style={styles.submit} />

          <Link href="/(auth)/log-in" style={styles.footerLink}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerTextAccent}>Log in</Text>
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.likhaYellow,
    borderColor: colors.likhaYellow,
  },
  termsText: {
    ...t.body,
    flex: 1,
    color: colors.warmBrown,
  },
  termsAccent: {
    color: colors.golden,
    fontFamily: t.bodyMedium.fontFamily,
  },
  submit: {
    marginTop: spacing.xs,
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

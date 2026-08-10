import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '../../components/ui';
import { colors, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function SignUpScreen() {
  const signUp = useSessionStore((s) => s.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = name.trim().length > 0 && email.includes('@') && password.length >= 6;

  const handleSubmit = () => {
    if (!canSubmit) return;
    signUp(name.trim(), email.trim());
    router.push('/(auth)/onboarding-mode');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join Likha and start showcasing your work.</Text>

          <TextField label="Full name" placeholder="Juan Dela Cruz" value={name} onChangeText={setName} />
          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button label="Sign Up" onPress={handleSubmit} disabled={!canSubmit} style={styles.submit} />

          <Button label="Continue with Google" variant="ghost" style={styles.oauth} />
          <Button label="Continue with Facebook" variant="ghost" style={styles.oauth} />

          <Link href="/(auth)/log-in" style={styles.footerLink}>
            <Text style={styles.footerText}>Already have an account? Log in</Text>
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
  submit: {
    marginTop: spacing.sm,
  },
  oauth: {
    marginTop: spacing.sm,
  },
  footerLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  footerText: {
    ...t.bodyMedium,
    color: colors.terracotta,
  },
});

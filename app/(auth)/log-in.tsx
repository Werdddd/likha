import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '../../components/ui';
import { colors, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';

export default function LogInScreen() {
  const logIn = useSessionStore((s) => s.logIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.includes('@') && password.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    logIn(email.trim());
    router.replace('/(tabs)/discover');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to continue creating.</Text>

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
            placeholder="Your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button label="Log In" onPress={handleSubmit} disabled={!canSubmit} style={styles.submit} />

          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            <Text style={styles.footerText}>New to Likha? Create an account</Text>
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
  footerLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  footerText: {
    ...t.bodyMedium,
    color: colors.terracotta,
  },
});

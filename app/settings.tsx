import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useSessionStore } from '../store/session-store';

interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const logOut = useSessionStore((s) => s.logOut);

  const handleLogOut = () => {
    logOut();
    router.replace('/');
  };

  const accountRows: SettingsRow[] = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/profile-edit') },
    { icon: 'receipt-outline', label: 'My Orders', onPress: () => router.push('/orders') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
  ];

  const sessionRows: SettingsRow[] = [
    { icon: 'log-out-outline', label: 'Log out', onPress: handleLogOut, destructive: true },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar uri={currentUser.avatarUrl} size={52} bordered />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <Text style={styles.profileHandle}>@{currentUser.handle}</Text>
          </View>
        </View>

        <SettingsSection title="Account" rows={accountRows} />
        <SettingsSection title="Session" rows={sessionRows} />

        <Text style={styles.version}>Likha · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, rows }: { title?: string; rows: SettingsRow[] }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <AnimatedPressable
            key={row.label}
            style={[styles.row, index < rows.length - 1 && styles.rowDivider]}
            onPress={row.onPress}
            scaleTo={0.98}
          >
            <View style={[styles.rowIconWrap, row.destructive && styles.rowIconWrapDestructive]}>
              <Ionicons
                name={row.icon}
                size={17}
                color={row.destructive ? colors.terracotta : colors.ink}
              />
            </View>
            <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDestructive]}>{row.label}</Text>
            {!row.destructive && <Ionicons name="chevron-forward" size={16} color={colors.warmBrown} />}
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  profileText: {
    gap: 2,
    marginLeft: spacing.md,
  },
  profileName: {
    ...t.h3,
    color: colors.ink,
  },
  profileHandle: {
    ...t.caption,
    color: colors.warmBrown,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...t.label,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowIconWrapDestructive: {
    backgroundColor: colors.terracotta + '1a',
  },
  rowLabel: {
    ...t.body,
    color: colors.ink,
    flex: 1,
  },
  rowLabelDestructive: {
    color: colors.terracotta,
  },
  version: {
    ...t.caption,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

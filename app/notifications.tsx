import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../components/ui';
import { getCreatorById, getProjectById, notifications } from '../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import type { Notification, NotificationKind } from '../types';

const VERB: Record<NotificationKind, string> = {
  appreciation: 'appreciated your project',
  follow: 'started following you',
  comment: 'commented on your project',
};

const ICON: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  appreciation: 'heart',
  follow: 'person-add',
  comment: 'chatbubble',
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: 'Notifications' }} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <NotificationRow notification={item} />}
      />
    </SafeAreaView>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const creator = getCreatorById(notification.creatorId);
  const project = notification.projectId ? getProjectById(notification.projectId) : undefined;
  if (!creator) return null;

  return (
    <AnimatedPressable
      style={styles.row}
      scaleTo={0.98}
      onPress={() => {
        if (project) router.push(`/project/${project.id}`);
        else router.push(`/creator/${creator.id}`);
      }}
    >
      <View style={styles.iconBadgeWrap}>
        <Avatar uri={creator.avatarUrl} size={48} bordered />
        <View style={styles.iconBadge}>
          <Ionicons name={ICON[notification.kind]} size={11} color={colors.white} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.text}>
          <Text style={styles.name}>{creator.name}</Text> {VERB[notification.kind]}
          {project ? ` "${project.title}"` : ''}
        </Text>
        <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  iconBadgeWrap: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  text: {
    ...t.body,
    color: colors.ink,
  },
  name: {
    fontFamily: t.bodyMedium.fontFamily,
  },
  time: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    marginLeft: spacing.sm,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../components/ui';
import { getConversationsSorted, getCreatorById } from '../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { timeAgo } from '../lib/format';
import { useMessageStore } from '../store/message-store';
import type { Conversation } from '../types';

export default function MessagesScreen() {
  const conversations = useMessageStore((s) => s.conversations);
  const sorted = getConversationsSorted(conversations);

  if (sorted.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Messages' }} />
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>Conversations with creators and buyers will show up here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Messages' }} />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
      />
    </SafeAreaView>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const creator = getCreatorById(conversation.creatorId);
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  if (!creator || !lastMessage) return null;

  return (
    <AnimatedPressable
      style={styles.row}
      scaleTo={0.98}
      onPress={() => router.push(`/message/${conversation.id}`)}
    >
      <Avatar uri={creator.avatarUrl} size={48} bordered />

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.name} numberOfLines={1}>{creator.name}</Text>
          <Text style={styles.time}>{timeAgo(lastMessage.createdAt)}</Text>
        </View>
        <Text style={[styles.preview, !conversation.read && styles.previewUnread]} numberOfLines={1}>
          {lastMessage.fromMe ? 'You: ' : ''}{lastMessage.text}
        </Text>
      </View>

      {!conversation.read && <View style={styles.unreadDot} />}
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
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...t.bodyMedium,
    color: colors.ink,
    flexShrink: 1,
  },
  time: {
    ...t.caption,
    color: colors.warmBrown,
  },
  preview: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: 2,
  },
  previewUnread: {
    color: colors.ink,
    fontFamily: t.bodyMedium.fontFamily,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    marginLeft: spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

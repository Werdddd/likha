import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { timeAgo } from '../lib/format';
import { useCreatorStore } from '../store/creator-store';
import { useMessageStore } from '../store/message-store';
import type { Conversation } from '../types';

export default function MessagesScreen() {
  const conversations = useMessageStore((s) => s.conversations);
  const fetchConversations = useMessageStore((s) => s.fetchConversations);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  if (conversations.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Messages' }} />
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <Ionicons name="chatbubbles-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>Conversations with creators and buyers will show up here.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Messages' }} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      />
    </SafeAreaView>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const creator = useCreatorStore((s) => s.getCreator(conversation.creatorId));
  const lastMessage = conversation.lastMessage;
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

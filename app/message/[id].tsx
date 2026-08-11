import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../../components/ui';
import { getCreatorById } from '../../constants/mock-data';
import { colors, fonts, radius, spacing, type as t } from '../../constants/theme';
import { timeAgo } from '../../lib/format';
import { useMessageStore } from '../../store/message-store';
import type { Message } from '../../types';

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = useMessageStore((s) => s.conversations.find((c) => c.id === id));
  const markRead = useMessageStore((s) => s.markRead);
  const sendMessage = useMessageStore((s) => s.sendMessage);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (conversation && !conversation.read) markRead(conversation.id);
  }, [conversation, markRead]);

  const creator = conversation ? getCreatorById(conversation.creatorId) : undefined;

  if (!conversation || !creator) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Message' }} />
        <Text style={styles.notFound}>Conversation not found.</Text>
      </SafeAreaView>
    );
  }

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conversation.id, text);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <AnimatedPressable
              style={styles.headerTitle}
              scaleTo={0.97}
              onPress={() => router.push(`/creator/${creator.id}`)}
            >
              <Avatar uri={creator.avatarUrl} size={32} />
              <Text style={styles.headerName} numberOfLines={1}>{creator.name}</Text>
            </AnimatedPressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {conversation.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              showTime={
                index === 0 ||
                new Date(message.createdAt).getTime() -
                  new Date(conversation.messages[index - 1].createdAt).getTime() >
                  1000 * 60 * 30
              }
            />
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor={colors.warmBrown}
            multiline
          />
          <AnimatedPressable
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!draft.trim()}
            scaleTo={0.9}
          >
            <Ionicons name="arrow-up" size={18} color={colors.ink} />
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, showTime }: { message: Message; showTime: boolean }) {
  return (
    <View>
      {showTime && (
        <Text style={styles.timeDivider}>{timeAgo(message.createdAt)}</Text>
      )}
      <View style={[styles.bubbleRow, message.fromMe && styles.bubbleRowMe]}>
        <View style={[styles.bubble, message.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, message.fromMe && styles.bubbleTextMe]}>{message.text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  notFound: {
    ...t.body,
    padding: spacing.lg,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  timeDivider: {
    ...t.caption,
    color: colors.warmBrown,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleThem: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleMe: {
    backgroundColor: colors.likhaYellow,
    borderBottomRightRadius: radius.sm,
  },
  bubbleText: {
    ...t.body,
    color: colors.ink,
  },
  bubbleTextMe: {
    color: colors.ink,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.softGray,
    backgroundColor: colors.canvas,
  },
  input: {
    ...t.body,
    flex: 1,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

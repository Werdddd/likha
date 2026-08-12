import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import {
  conversationRowToConversation,
  messageRowToMessage,
  type ConversationRow,
  type MessageRow,
} from '../lib/supabase/mappers';
import type { Conversation, Message } from '../types';
import { useCreatorStore } from './creator-store';
import { useSessionStore } from './session-store';

const CONVERSATION_SELECT = '*, messages(id, conversation_id, sender_id, text, created_at)';

interface MessageState {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  isLoadingConversations: boolean;
  fetchConversations: () => Promise<void>;
  fetchConversationById: (conversationId: string) => Promise<Conversation | null>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<{ error: string | null }>;
  markRead: (conversationId: string) => Promise<void>;
  getOrCreateConversation: (otherUserId: string) => Promise<string | null>;
  subscribeToConversation: (conversationId: string) => () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  isLoadingConversations: false,

  fetchConversations: async () => {
    const myId = useSessionStore.getState().currentUser.id;
    if (!myId) return;

    set({ isLoadingConversations: true });
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)
      .order('created_at', { ascending: false, referencedTable: 'messages' })
      .limit(1, { referencedTable: 'messages' })
      .order('last_message_at', { ascending: false });
    set({ isLoadingConversations: false });
    if (error || !data) return;

    const rows = data as ConversationRow[];
    const otherIds = rows.map((row) => (row.user_a_id === myId ? row.user_b_id : row.user_a_id));
    await useCreatorStore.getState().fetchByIds(otherIds);

    set({ conversations: rows.map((row) => conversationRowToConversation(row, myId)) });
  },

  fetchConversationById: async (conversationId) => {
    const myId = useSessionStore.getState().currentUser.id;
    if (!myId) return null;

    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('id', conversationId)
      .maybeSingle();
    if (error || !data) return null;

    const row = data as ConversationRow;
    const otherId = row.user_a_id === myId ? row.user_b_id : row.user_a_id;
    await useCreatorStore.getState().fetchByIds([otherId]);

    const conversation = conversationRowToConversation(row, myId);
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      return {
        conversations: exists
          ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...state.conversations],
      };
    });

    return conversation;
  },

  fetchMessages: async (conversationId) => {
    const myId = useSessionStore.getState().currentUser.id;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error || !data) return;

    const messages = (data as MessageRow[]).map((row) => messageRowToMessage(row, myId));
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    }));
  },

  sendMessage: async (conversationId, text) => {
    const myId = useSessionStore.getState().currentUser.id;
    if (!myId) return { error: 'Not signed in.' };

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: myId, text })
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not send message.' };

    const message = messageRowToMessage(data as MessageRow, myId);
    set((state) => {
      const existing = state.messagesByConversation[conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) return {};
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    });
    return { error: null };
  },

  markRead: async (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, read: true } : c)),
    }));
    await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
  },

  getOrCreateConversation: async (otherUserId) => {
    const myId = useSessionStore.getState().currentUser.id;
    if (!myId) return null;

    const findExisting = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(user_a_id.eq.${myId},user_b_id.eq.${otherUserId}),and(user_a_id.eq.${otherUserId},user_b_id.eq.${myId})`,
        )
        .maybeSingle();
      return data?.id ?? null;
    };

    const existingId = await findExisting();
    if (existingId) return existingId;

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ user_a_id: myId, user_b_id: otherUserId })
      .select('id')
      .single();
    if (!error && created) return created.id;

    // Likely a race with the other side creating the same pair at the same time; re-check.
    return findExisting();
  },

  subscribeToConversation: (conversationId) => {
    const myId = useSessionStore.getState().currentUser.id;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const message = messageRowToMessage(payload.new as MessageRow, myId);
          set((state) => {
            const existing = state.messagesByConversation[conversationId] ?? [];
            if (existing.some((m) => m.id === message.id)) return {};
            return {
              messagesByConversation: {
                ...state.messagesByConversation,
                [conversationId]: [...existing, message],
              },
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

import { create } from 'zustand';

import { conversations as mockConversations } from '../constants/mock-data';
import type { Conversation } from '../types';

interface MessageState {
  conversations: Conversation[];
  markRead: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  getOrCreateConversation: (creatorId: string) => string;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: mockConversations.map((c) => ({ ...c, messages: [...c.messages] })),
  getOrCreateConversation: (creatorId) => {
    const existing = get().conversations.find((c) => c.creatorId === creatorId);
    if (existing) return existing.id;

    const id = `conv-${creatorId}-${Date.now()}`;
    set((state) => ({
      conversations: [...state.conversations, { id, creatorId, messages: [], read: true }],
    }));
    return id;
  },
  markRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, read: true } : c,
      ),
    })),
  sendMessage: (conversationId, text) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              read: true,
              messages: [
                ...c.messages,
                {
                  id: `${conversationId}-${Date.now()}`,
                  fromMe: true,
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : c,
      ),
    })),
}));

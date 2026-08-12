import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { notificationRowToNotification, type NotificationRow } from '../lib/supabase/mappers';
import type { Notification } from '../types';
import { useCreatorStore } from './creator-store';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    set({ isLoading: false });
    if (error || !data) return;

    const rows = data as NotificationRow[];
    await useCreatorStore.getState().fetchByIds(rows.map((row) => row.actor_id));
    set({ notifications: rows.map(notificationRowToNotification) });
  },

  markAllRead: async () => {
    const unreadIds = get().notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  },
}));

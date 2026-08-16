import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AnimatedPressable } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { useCreatorStore } from '../store/creator-store';
import { useListingStore } from '../store/listing-store';
import { useNotificationStore } from '../store/notification-store';
import { useProjectStore } from '../store/project-store';
import type { Notification, NotificationKind } from '../types';

const VERB: Record<NotificationKind, string> = {
  appreciation: 'appreciated your project',
  follow: 'started following you',
  comment: 'commented on your project',
  job_offer: 'sent an offer on your job post',
  job_offer_accepted: 'accepted your offer',
  job_offer_rejected: 'declined your offer',
  job_offer_withdrawn: 'withdrew their offer',
  job_order_milestone_paid: 'submitted a milestone payment',
  job_order_milestone_released: 'released a milestone payment',
  job_order_update: 'posted a progress update',
  job_order_revision: 'requested a revision',
  job_order_delivered: 'marked your job order as delivered',
  job_order_cancelled: 'cancelled the job order',
  content_flagged: 'submitted this for review',
  content_approved: 'approved',
  content_rejected: 'rejected',
  content_hidden: 'hid',
  content_restored: 'restored',
  content_removed: 'removed',
  review: 'left a review on your listing',
  order_placed: 'placed an order from your shop',
  order_shipped: 'shipped your order',
  order_delivered: 'marked your order as delivered',
  order_rejected: 'rejected your order',
  order_cancelled: 'cancelled their order',
  payment_verified: 'verified your payment',
  message: 'sent you a message',
  job_post_comment: 'commented on your job post',
};

const ICON: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  appreciation: 'heart',
  follow: 'person-add',
  comment: 'chatbubble',
  job_offer: 'briefcase',
  job_offer_accepted: 'checkmark-circle',
  job_offer_rejected: 'close-circle',
  job_offer_withdrawn: 'arrow-undo',
  job_order_milestone_paid: 'card',
  job_order_milestone_released: 'cash',
  job_order_update: 'chatbox-ellipses',
  job_order_revision: 'refresh',
  job_order_delivered: 'cube',
  job_order_cancelled: 'ban',
  content_flagged: 'shield-checkmark',
  content_approved: 'checkmark-circle',
  content_rejected: 'close-circle',
  content_hidden: 'eye-off',
  content_restored: 'eye',
  content_removed: 'trash',
  review: 'star',
  order_placed: 'bag-check',
  order_shipped: 'cube',
  order_delivered: 'checkmark-circle',
  order_rejected: 'close-circle',
  order_cancelled: 'ban',
  payment_verified: 'card',
  message: 'chatbubble-ellipses',
  job_post_comment: 'chatbubble',
};

// order_placed/order_cancelled land on the seller (via /creator-order); the buyer-facing
// statuses and payment_verified land on the buyer (via /order) -- role is implied by kind,
// since each of these notification kinds only ever has one possible recipient role.
const SELLER_FACING_ORDER_KINDS: ReadonlySet<NotificationKind> = new Set(['order_placed', 'order_cancelled']);

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const notifications = useNotificationStore((s) => s.notifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const fetchProjectById = useProjectStore((s) => s.fetchById);
  const fetchListingById = useListingStore((s) => s.fetchById);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  useEffect(() => {
    notifications.forEach((n) => {
      if (n.projectId) fetchProjectById(n.projectId);
      if (n.listingId) fetchListingById(n.listingId);
    });
  }, [notifications, fetchProjectById, fetchListingById]);

  useEffect(() => {
    if (notifications.some((n) => !n.read)) markAllRead();
  }, [notifications, markAllRead]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Notifications' }} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <NotificationRow notification={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      />
    </SafeAreaView>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const creator = useCreatorStore((s) => s.getCreator(notification.creatorId));
  const project = useProjectStore((s) =>
    notification.projectId ? s.projectsById[notification.projectId] : undefined,
  );
  const listing = useListingStore((s) =>
    notification.listingId ? s.listingsById[notification.listingId] : undefined,
  );
  if (!creator) return null;

  // content_removed never has a live project/listing to open (the post is gone) -- the
  // title shown falls back to the snapshot taken at removal time.
  const itemTitle = project?.title ?? listing?.title ?? notification.contentTitle;

  return (
    <AnimatedPressable
      style={styles.row}
      scaleTo={0.98}
      onPress={() => {
        if (notification.orderId) {
          router.push(
            SELLER_FACING_ORDER_KINDS.has(notification.kind)
              ? `/creator-order/${notification.orderId}`
              : `/order/${notification.orderId}`,
          );
        } else if (notification.conversationId) router.push(`/message/${notification.conversationId}`);
        else if (notification.jobOrderId) router.push(`/job-order/${notification.jobOrderId}`);
        else if (notification.jobPostId) router.push(`/job-post/${notification.jobPostId}`);
        else if (project) router.push(`/project/${project.id}`);
        else if (listing) router.push(`/listing/${listing.id}`);
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
          {itemTitle ? ` "${itemTitle}"` : ''}
        </Text>
        {notification.note && <Text style={styles.note}>“{notification.note}”</Text>}
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
  note: {
    ...t.caption,
    color: colors.warmBrown,
    fontStyle: 'italic',
    marginTop: 2,
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

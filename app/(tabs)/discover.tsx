import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedWorks } from '../../components/FeaturedWorks';
import { FilterBar } from '../../components/FilterBar';
import { MasonryGrid } from '../../components/MasonryGrid';
import { AnimatedPressable } from '../../components/ui';
import { categories } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useCreatorStore } from '../../store/creator-store';
import { useMessageStore } from '../../store/message-store';
import { useNotificationStore } from '../../store/notification-store';
import { useProjectStore } from '../../store/project-store';
import type { Category } from '../../types';

export default function DiscoverScreen() {
  const [category, setCategory] = useState<Category | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const hasUnread = useMemo(() => notifications.some((n) => !n.read), [notifications]);
  const conversations = useMessageStore((s) => s.conversations);
  const fetchConversations = useMessageStore((s) => s.fetchConversations);
  const hasUnreadMessages = useMemo(() => conversations.some((c) => !c.read), [conversations]);

  const projectsById = useProjectStore((s) => s.projectsById);
  const fetchFeed = useProjectStore((s) => s.fetchFeed);
  const getCreator = useCreatorStore((s) => s.getCreator);

  useEffect(() => {
    fetchFeed();
    fetchNotifications();
    fetchConversations();
  }, [fetchFeed, fetchNotifications, fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(), fetchNotifications(), fetchConversations()]);
    setRefreshing(false);
  }, [fetchFeed, fetchNotifications, fetchConversations]);

  const projects = useMemo(
    () => Object.values(projectsById).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [projectsById],
  );

  const filteredProjects = useMemo(
    () => (category ? projects.filter((p) => p.categories.includes(category)) : projects),
    [category, projects],
  );

  const featuredProjects = useMemo(
    () => [...projects].sort((a, b) => b.appreciations - a.appreciations).slice(0, 8),
    [projects],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/likha-logo.png')}
            style={styles.logo}
            contentFit="cover"
          />
          {/* <Text style={styles.tagline}>Likha ng Pilipino. Gawa para sa mundo.</Text> */}
        </View>
        <View style={styles.headerActions}>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/messages')} scaleTo={0.92}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.ink} />
            {hasUnreadMessages && <View style={styles.unreadDot} />}
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/notifications')} scaleTo={0.92}>
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {hasUnread && <View style={styles.unreadDot} />}
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={() => router.push('/search')} scaleTo={0.92}>
            <Ionicons name="search" size={20} color={colors.ink} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.filterBar}>
        <FilterBar
          options={categories}
          selected={category}
          onSelect={(value) => setCategory(value as Category | null)}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <FeaturedWorks
          projects={featuredProjects}
          getCreator={getCreator}
          onPressProject={(project) => router.push(`/project/${project.id}`)}
        />

        <Text style={styles.sectionTitle}>For You</Text>
        <View style={styles.gridWrap}>
          <MasonryGrid
            projects={filteredProjects}
            getCreator={getCreator}
            onPressProject={(project) => router.push(`/project/${project.id}`)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  brand: {
    flex: 1,
    marginRight: spacing.sm,
  },
  logo: {
    width: 101,
    height: 44,
    marginLeft: -spacing.sm,
  },
  tagline: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
   
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  filterBar: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
  sectionTitle: {
    ...t.h3,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  gridWrap: {
    paddingHorizontal: spacing.sm,
  },
});

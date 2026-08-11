import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedWorks } from '../../components/FeaturedWorks';
import { FilterBar } from '../../components/FilterBar';
import { MasonryGrid } from '../../components/MasonryGrid';
import { AnimatedPressable } from '../../components/ui';
import { categories, getCreatorById, getListingByProjectId, notifications, projects } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { useMessageStore } from '../../store/message-store';
import type { Category } from '../../types';

export default function DiscoverScreen() {
  const [category, setCategory] = useState<Category | null>(null);
  const hasUnread = useMemo(() => notifications.some((n) => !n.read), []);
  const hasUnreadMessages = useMessageStore((s) => s.conversations.some((c) => !c.read));

  const filteredProjects = useMemo(
    () => (category ? projects.filter((p) => p.category === category) : projects),
    [category],
  );

  const featuredProjects = useMemo(
    () => [...projects].sort((a, b) => b.appreciations - a.appreciations).slice(0, 8),
    [],
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

      <ScrollView contentContainerStyle={styles.list}>
        <FeaturedWorks
          projects={featuredProjects}
          getCreator={getCreatorById}
          onPressProject={(project) => router.push(`/project/${project.id}`)}
        />

        <Text style={styles.sectionTitle}>For You</Text>
        <View style={styles.gridWrap}>
          <MasonryGrid
            projects={filteredProjects}
            getCreator={getCreatorById}
            getListing={getListingByProjectId}
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

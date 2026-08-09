import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../../components/ProjectCard';
import { Avatar, Button } from '../../components/ui';
import { getCreatorById, getProjectsByCreator } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = getCreatorById(id);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!creator) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Creator' }} />
        <Text style={styles.body}>Creator not found.</Text>
      </SafeAreaView>
    );
  }

  const creatorProjects = getProjectsByCreator(creator.id);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: colors.ink }} />
      <ScrollView>
        <Image source={{ uri: creator.coverUrl }} style={styles.cover} contentFit="cover" />

        <View style={styles.content}>
          <View style={styles.avatarRow}>
            <Avatar uri={creator.avatarUrl} size={72} />
            <View style={styles.actionButtons}>
              {creator.profileMode === 'open_for_work' && (
                <Button label="Hire Me" onPress={() => {}} style={styles.hireButton} />
              )}
              <Button
                label={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'ghost' : 'secondary'}
                onPress={() => setIsFollowing((v) => !v)}
              />
            </View>
          </View>

          <Text style={styles.name}>{creator.name}</Text>
          <Text style={styles.handle}>
            @{creator.handle} · {creator.region}
          </Text>
          <Text style={styles.bio}>{creator.bio}</Text>

          {creator.responseTime && <Text style={styles.responseTime}>{creator.responseTime}</Text>}

          <View style={styles.statsRow}>
            <Stat label="Projects" value={creator.projectCount} />
            <Stat label="Followers" value={creator.followerCount} />
            <Stat label="Following" value={creator.followingCount} />
          </View>

          <Text style={styles.sectionTitle}>Projects</Text>
        </View>

        <View style={styles.grid}>
          {creatorProjects.map((project) => (
            <View key={project.id} style={styles.cardWrapper}>
              <ProjectCard project={project} onPress={() => router.push(`/project/${project.id}`)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  cover: {
    width: '100%',
    height: 140,
    backgroundColor: colors.softGray,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -36,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hireButton: {
    paddingHorizontal: spacing.md,
  },
  name: {
    ...t.h2,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  handle: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  bio: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  responseTime: {
    ...t.caption,
    color: colors.terracotta,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    ...t.h3,
    color: colors.ink,
  },
  statLabel: {
    ...t.caption,
    color: colors.warmBrown,
  },
  sectionTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: spacing.xs,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../../components/ProjectCard';
import { Avatar, Button, Chip } from '../../components/ui';
import { getProjectsByCreator } from '../../constants/mock-data';
import { colors, spacing, type as t } from '../../constants/theme';
import { useSessionStore } from '../../store/session-store';
import type { ProfileMode } from '../../types';

export default function ProfileScreen() {
  const currentUser = useSessionStore((s) => s.currentUser);
  const setProfileMode = useSessionStore((s) => s.setProfileMode);
  const myProjects = getProjectsByCreator(currentUser.id);

  const toggleMode = (mode: ProfileMode) => setProfileMode(mode);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView>
        <Image source={{ uri: currentUser.coverUrl }} style={styles.cover} contentFit="cover" />

        <View style={styles.content}>
          <View style={styles.avatarRow}>
            <Avatar uri={currentUser.avatarUrl} size={72} />
            <Button label="Edit Profile" variant="secondary" onPress={() => router.push('/profile-edit')} />
          </View>

          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.handle}>
            @{currentUser.handle} · {currentUser.region}
          </Text>
          <Text style={styles.bio}>{currentUser.bio}</Text>

          <View style={styles.statsRow}>
            <Stat label="Projects" value={currentUser.projectCount} />
            <Stat label="Followers" value={currentUser.followerCount} />
            <Stat label="Following" value={currentUser.followingCount} />
          </View>

          <View style={styles.modeRow}>
            <Chip
              label="Portfolio only"
              selected={currentUser.profileMode === 'portfolio'}
              onPress={() => toggleMode('portfolio')}
            />
            <Chip
              label="Open for work"
              selected={currentUser.profileMode === 'open_for_work'}
              onPress={() => toggleMode('open_for_work')}
            />
          </View>

          <Text style={styles.sectionTitle}>Projects</Text>
        </View>

        <View style={styles.grid}>
          {myProjects.map((project) => (
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
  modeRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
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
});

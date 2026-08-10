import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type as t } from '../constants/theme';
import type { Creator } from '../types';
import { Avatar } from './ui/Avatar';

interface ProfileHeaderProps {
  creator: Creator;
  actions?: ReactNode;
  modeToggle?: ReactNode;
}

export function ProfileHeader({ creator, actions, modeToggle }: ProfileHeaderProps) {
  return (
    <View>
      <Image source={{ uri: creator.coverUrl }} style={styles.cover} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.avatarRow}>
          <Avatar uri={creator.avatarUrl} size={76} bordered />
          {actions}
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

        {modeToggle && <View style={styles.modeRow}>{modeToggle}</View>}

        <Text style={styles.sectionTitle}>Portfolio</Text>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 160,
    backgroundColor: colors.softGray,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -38,
  },
  name: {
    ...t.h2,
    color: colors.ink,
    marginTop: spacing.md,
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
    gap: spacing.xl,
    marginTop: spacing.lg,
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
    marginTop: 2,
  },
  modeRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});

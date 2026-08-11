import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import type { Creator } from '../types';
import { Avatar } from './ui/Avatar';

interface ProfileHeaderProps {
  creator: Creator;
  actions?: ReactNode;
}

const BADGE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Top Seller': 'ribbon',
  'Verified ID': 'checkmark-circle',
  'Fast Responder': 'flash',
  Student: 'school',
};

export function ProfileHeader({ creator, actions }: ProfileHeaderProps) {
  return (
    <View>
      <Image source={{ uri: creator.coverUrl }} style={styles.cover} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <Avatar uri={creator.avatarUrl} size={84} bordered />
          </View>
          {actions}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{creator.name}</Text>
          {creator.badges.includes('Verified ID') && (
            <Ionicons name="checkmark-circle" size={18} color={colors.terracotta} style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={styles.handle}>
          @{creator.handle} · {creator.region}
        </Text>

        <View style={styles.pillRow}>
          {creator.categories.map((category) => (
            <View key={category} style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{category}</Text>
            </View>
          ))}
          {creator.profileMode === 'open_for_work' && (
            <View style={styles.openPill}>
              <View style={styles.openDot} />
              <Text style={styles.openPillText}>Open for work</Text>
            </View>
          )}
        </View>

        <Text style={styles.bio}>{creator.bio}</Text>

        {creator.badges.length > 0 && (
          <View style={styles.badgeRow}>
            {creator.badges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Ionicons name={BADGE_ICONS[badge] ?? 'star'} size={13} color={colors.golden} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsCard}>
          <Stat label="Projects" value={creator.projectCount} />
          <View style={styles.statDivider} />
          <Stat label="Followers" value={creator.followerCount} />
          <View style={styles.statDivider} />
          <Stat label="Following" value={creator.followingCount} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <Text style={styles.sectionCount}>{creator.projectCount}</Text>
        </View>
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
    height: 180,
    backgroundColor: colors.softGray,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    marginTop: -42,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    ...shadow.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  name: {
    ...t.h2,
    color: colors.ink,
  },
  verifiedIcon: {
    marginLeft: spacing.xs,
  },
  handle: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryPill: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray,
  },
  categoryPillText: {
    ...t.label,
    fontSize: 12,
    color: colors.ink,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.likhaYellow + '33',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.golden,
    marginRight: spacing.xs,
  },
  openPillText: {
    ...t.label,
    fontSize: 12,
    color: colors.warmBrown,
  },
  bio: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.softGray,
  },
  badgeText: {
    ...t.caption,
    color: colors.warmBrown,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.softGray,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.softGray,
  },
  sectionTitle: {
    ...t.h3,
    color: colors.ink,
  },
  sectionCount: {
    ...t.caption,
    color: colors.warmBrown,
  },
});

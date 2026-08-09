import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import type { Creator } from '../types';
import { Avatar } from './ui/Avatar';

interface CreatorCardProps {
  creator: Creator;
  onPress?: () => void;
}

export function CreatorCard({ creator, onPress }: CreatorCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Avatar uri={creator.avatarUrl} size={56} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {creator.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {creator.discipline} · {creator.region}
        </Text>
      </View>
      {creator.profileMode === 'open_for_work' && (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Open for work</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  meta: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.likhaYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeLabel: {
    ...t.caption,
    color: colors.ink,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

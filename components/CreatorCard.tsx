import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import type { Creator } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Avatar } from './ui/Avatar';

interface CreatorCardProps {
  creator: Creator;
  onPress?: () => void;
}

export function CreatorCard({ creator, onPress }: CreatorCardProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleTo={0.97}>
      <Avatar uri={creator.avatarUrl} size={56} bordered />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {creator.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {creator.disciplines.join(', ')} · {creator.region}
        </Text>
      </View>
      {creator.profileMode === 'open_for_work' && (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Open for work</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
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

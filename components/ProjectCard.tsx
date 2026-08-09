import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import type { Creator, Project } from '../types';

interface ProjectCardProps {
  project: Project;
  creator?: Creator;
  onPress?: () => void;
}

export function ProjectCard({ project, creator, onPress }: ProjectCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: project.coverUrl }} style={styles.cover} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {project.title}
        </Text>
        {creator && (
          <Text style={styles.creator} numberOfLines={1}>
            {creator.name} · {project.region}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.softGray,
  },
  body: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  title: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creator: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import type { Project } from '../types';
import { AnimatedPressable } from './ui/AnimatedPressable';

interface CategoryRowProps {
  title: string;
  projects: Project[];
  onPressProject: (project: Project) => void;
  onSeeAll: () => void;
}

export function CategoryRow({ title, projects, onPressProject, onSeeAll }: CategoryRowProps) {
  return (
    <View style={styles.section}>
      <AnimatedPressable style={styles.header} onPress={onSeeAll} scaleTo={0.98}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>
            {projects.length} project{projects.length === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.seeAll}>
          <Text style={styles.seeAllLabel}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.warmBrown} />
        </View>
      </AnimatedPressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {projects.map((project) => (
          <AnimatedPressable
            key={project.id}
            style={styles.thumb}
            onPress={() => onPressProject(project)}
            scaleTo={0.96}
          >
            <Image source={{ uri: project.coverUrl }} style={styles.thumbImage} contentFit="cover" />
            <Text style={styles.thumbLabel} numberOfLines={1}>
              {project.title}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
    </View>
  );
}

const THUMB_SIZE = 128;

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...t.h3,
    color: colors.ink,
  },
  count: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 1,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllLabel: {
    ...t.label,
    color: colors.warmBrown,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  thumb: {
    width: THUMB_SIZE,
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray,
    ...shadow.sm,
  },
  thumbLabel: {
    ...t.caption,
    color: colors.ink,
    marginTop: spacing.xs,
  },
});

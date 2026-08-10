import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, colors, type as t } from '../constants/theme';
import { pseudoRatioForId, splitIntoBalancedColumns } from '../lib/masonry';
import type { Creator, Project } from '../types';
import { ProjectCard } from './ProjectCard';

interface MasonryGridProps {
  projects: Project[];
  getCreator?: (creatorId: string) => Creator | undefined;
  onPressProject: (project: Project) => void;
  emptyLabel?: string;
}

export function MasonryGrid({ projects, getCreator, onPressProject, emptyLabel }: MasonryGridProps) {
  const [left, right] = useMemo(
    () => splitIntoBalancedColumns(projects, (p) => pseudoRatioForId(p.id)),
    [projects],
  );

  if (projects.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel ?? 'Nothing to show yet.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        {left.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            creator={getCreator?.(project.creatorId)}
            onPress={() => onPressProject(project)}
          />
        ))}
      </View>
      <View style={styles.column}>
        {right.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            creator={getCreator?.(project.creatorId)}
            onPress={() => onPressProject(project)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
  },
});

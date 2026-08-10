import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '../../components/FilterBar';
import { MasonryGrid } from '../../components/MasonryGrid';
import { AnimatedPressable } from '../../components/ui';
import { disciplines, getCreatorById, projects } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import type { Discipline } from '../../types';

export default function DiscoverScreen() {
  const [discipline, setDiscipline] = useState<Discipline | null>(null);

  const filteredProjects = useMemo(
    () => (discipline ? projects.filter((p) => p.discipline === discipline) : projects),
    [discipline],
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
          <Text style={styles.tagline}>Likha ng Pilipino. Gawa para sa mundo.</Text>
        </View>
        <AnimatedPressable style={styles.searchButton} onPress={() => router.push('/search')} scaleTo={0.92}>
          <Ionicons name="search" size={20} color={colors.ink} />
        </AnimatedPressable>
      </View>

      <View style={styles.filterBar}>
        <FilterBar
          options={disciplines}
          selected={discipline}
          onSelect={(value) => setDiscipline(value as Discipline | null)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <MasonryGrid
          projects={filteredProjects}
          getCreator={getCreatorById}
          onPressProject={(project) => router.push(`/project/${project.id}`)}
        />
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
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  filterBar: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
});

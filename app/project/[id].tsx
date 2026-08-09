import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/ui';
import { getCreatorById, getProjectById } from '../../constants/mock-data';
import { colors, radius, spacing, type as t } from '../../constants/theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = getProjectById(id);
  const creator = project ? getCreatorById(project.creatorId) : undefined;
  const [appreciated, setAppreciated] = useState(false);

  if (!project) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Project' }} />
        <Text style={styles.body}>Project not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: colors.ink }} />
      <ScrollView>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {project.media.map((media) => (
            <Image key={media.id} source={{ uri: media.url }} style={styles.mediaImage} contentFit="cover" />
          ))}
        </ScrollView>

        <View style={styles.content}>
          <Text style={styles.title}>{project.title}</Text>

          {creator && (
            <Link href={`/creator/${creator.id}`} asChild>
              <Pressable style={styles.creatorRow}>
                <Avatar uri={creator.avatarUrl} size={36} />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={styles.creatorName}>{creator.name}</Text>
                  <Text style={styles.creatorMeta}>{project.region}</Text>
                </View>
              </Pressable>
            </Link>
          )}

          <Text style={styles.description}>{project.description}</Text>

          <View style={styles.tagRow}>
            <Text style={styles.tag}>{project.discipline}</Text>
            {project.mediums.map((m) => (
              <Text key={m} style={styles.tag}>
                {m}
              </Text>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.appreciateButton} onPress={() => setAppreciated((v) => !v)}>
              <Ionicons
                name={appreciated ? 'heart' : 'heart-outline'}
                size={18}
                color={appreciated ? colors.terracotta : colors.ink}
              />
              <Text style={styles.appreciateLabel}>
                {project.appreciations + (appreciated ? 1 : 0)} Appreciations
              </Text>
            </Pressable>
            <View style={styles.appreciateButton}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.ink} />
              <Text style={styles.appreciateLabel}>{project.commentCount} Comments</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  mediaImage: {
    width: 400,
    height: 320,
    backgroundColor: colors.softGray,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...t.h1,
    color: colors.ink,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatorName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  creatorMeta: {
    ...t.caption,
    color: colors.warmBrown,
  },
  description: {
    ...t.body,
    color: colors.ink,
    marginTop: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tag: {
    ...t.caption,
    color: colors.warmBrown,
    backgroundColor: colors.softGray,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  appreciateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appreciateLabel: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});

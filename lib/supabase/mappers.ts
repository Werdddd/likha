import type { Category, Comment, Creator, ProfileMode, Project, ProjectMedia, Region } from '../../types';

export interface ProfileRow {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string;
  region: string | null;
  categories: string[];
  profile_mode: string;
  tags: string[];
  badges: string[];
  follower_count: number;
  following_count: number;
  project_count: number;
}

export function profileRowToCreator(row: ProfileRow): Creator {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatarUrl: row.avatar_url ?? '',
    coverUrl: row.cover_url ?? '',
    bio: row.bio,
    region: (row.region as Region) ?? 'Manila',
    categories: row.categories as Category[],
    profileMode: row.profile_mode as ProfileMode,
    tags: row.tags,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    projectCount: row.project_count,
    badges: row.badges,
  };
}

const EDITABLE_PROFILE_FIELDS = [
  'name',
  'handle',
  'avatarUrl',
  'coverUrl',
  'bio',
  'region',
  'categories',
  'profileMode',
  'tags',
] as const;

type EditableProfileFields = Pick<Creator, (typeof EDITABLE_PROFILE_FIELDS)[number]>;

const CAMEL_TO_SNAKE: Record<keyof EditableProfileFields, string> = {
  name: 'name',
  handle: 'handle',
  avatarUrl: 'avatar_url',
  coverUrl: 'cover_url',
  bio: 'bio',
  region: 'region',
  categories: 'categories',
  profileMode: 'profile_mode',
  tags: 'tags',
};

export function creatorUpdatesToProfileRow(
  updates: Partial<EditableProfileFields>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (updates[field] !== undefined) {
      row[CAMEL_TO_SNAKE[field]] = updates[field];
    }
  }
  return row;
}

export interface ProjectMediaRow {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  position: number;
}

export interface ProjectRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  categories: string[];
  mediums: string[];
  region: string;
  appreciation_count: number;
  comment_count: number;
  created_at: string;
  profiles?: ProfileRow | null;
  project_media?: ProjectMediaRow[];
}

export function projectRowToProject(row: ProjectRow): Project {
  const media: ProjectMedia[] = (row.project_media ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      id: m.id,
      type: m.type as ProjectMedia['type'],
      url: m.url,
      caption: m.caption ?? undefined,
    }));

  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url ?? media[0]?.url ?? '',
    media,
    categories: row.categories,
    mediums: row.mediums,
    region: row.region as Region,
    appreciations: row.appreciation_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  };
}

export interface CommentRow {
  id: string;
  project_id: string;
  creator_id: string;
  text: string;
  created_at: string;
}

export function commentRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    projectId: row.project_id,
    creatorId: row.creator_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

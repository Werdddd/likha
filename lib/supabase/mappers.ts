import type { Category, Creator, ProfileMode, Region } from '../../types';

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

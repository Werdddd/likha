export type ProfileMode = 'portfolio' | 'open_for_work';

export type Discipline =
  | 'Illustration'
  | 'Graphic Design'
  | 'Photography'
  | 'UI/UX Design'
  | 'Writing'
  | '3D Art'
  | 'Crafts';

export type Region =
  | 'Manila'
  | 'Cebu'
  | 'Davao'
  | 'Iloilo'
  | 'Baguio'
  | 'Bacolod';

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  region: Region;
  discipline: Discipline;
  profileMode: ProfileMode;
  tags: string[];
  followerCount: number;
  followingCount: number;
  projectCount: number;
  responseTime?: string;
  badges: string[];
}

export interface ProjectMedia {
  id: string;
  type: 'image' | 'video' | 'text';
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  coverUrl: string;
  media: ProjectMedia[];
  discipline: Discipline;
  mediums: string[];
  region: Region;
  appreciations: number;
  commentCount: number;
  createdAt: string;
}

export interface FilterState {
  query: string;
  discipline: Discipline | null;
  region: Region | null;
}

export type NotificationKind = 'appreciation' | 'follow' | 'comment';

export interface Notification {
  id: string;
  kind: NotificationKind;
  creatorId: string;
  projectId?: string;
  createdAt: string;
  read: boolean;
}

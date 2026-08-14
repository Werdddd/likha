import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { projectRowToProject, type ProfileRow, type ProjectRow } from '../lib/supabase/mappers';
import type { ModerationStatus, Project, Region } from '../types';
import { useCreatorStore } from './creator-store';

const PROJECT_SELECT = '*, profiles!projects_creator_id_fkey(*), project_media(*)';

interface CreateProjectInput {
  title: string;
  description: string;
  categories: string[];
  mediums: string[];
  region: Region;
  mediaUrls: string[];
  moderationStatus: 'clean' | 'pending_review';
  moderationReason?: string;
}

interface UpdateProjectInput {
  title?: string;
  description?: string;
  categories?: string[];
  mediums?: string[];
  mediaUrls?: string[];
  moderationStatus?: 'clean' | 'pending_review';
  moderationReason?: string;
}

interface ProjectState {
  projectsById: Record<string, Project>;
  isLoadingFeed: boolean;
  fetchFeed: () => Promise<void>;
  fetchByCreator: (creatorId: string) => Promise<Project[]>;
  fetchById: (id: string) => Promise<Project | null>;
  fetchPendingReview: () => Promise<Project[]>;
  moderateProject: (id: string, decision: 'approved' | 'rejected') => Promise<{ error: string | null }>;
  createProject: (
    creatorId: string,
    input: CreateProjectInput,
  ) => Promise<{ project: Project | null; error: string | null }>;
  updateProject: (
    id: string,
    input: UpdateProjectInput,
  ) => Promise<{ project: Project | null; error: string | null }>;
  appreciate: (projectId: string, userId: string) => Promise<void>;
  unappreciate: (projectId: string, userId: string) => Promise<void>;
  hasAppreciated: (projectId: string, userId: string) => Promise<boolean>;
  incrementCommentCount: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const upsertRows = (rows: ProjectRow[]) => {
    const profiles = rows.map((r) => r.profiles).filter((p): p is ProfileRow => !!p);
    useCreatorStore.getState().upsertFromRows(profiles);

    set((state) => {
      const next = { ...state.projectsById };
      for (const row of rows) {
        next[row.id] = projectRowToProject(row);
      }
      return { projectsById: next };
    });
  };

  return {
    projectsById: {},
    isLoadingFeed: false,

    fetchFeed: async () => {
      set({ isLoadingFeed: true });
      const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .order('created_at', { ascending: false });
      set({ isLoadingFeed: false });
      if (error || !data) return;
      upsertRows(data as ProjectRow[]);
    },

    fetchByCreator: async (creatorId) => {
      const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as ProjectRow[];
      upsertRows(rows);
      return rows.map(projectRowToProject);
    },

    fetchById: async (id) => {
      const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as ProjectRow;
      upsertRows([row]);
      return projectRowToProject(row);
    },

    fetchPendingReview: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('moderation_status', 'pending_review')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as ProjectRow[];
      upsertRows(rows);
      return rows.map(projectRowToProject);
    },

    moderateProject: async (id, decision) => {
      const { data, error } = await supabase.rpc('moderate_project', {
        p_project_id: id,
        p_decision: decision,
      });
      if (error) return { error: error.message };
      if (data) upsertRows([data as ProjectRow]);
      return { error: null };
    },

    createProject: async (creatorId, input) => {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          creator_id: creatorId,
          title: input.title,
          description: input.description,
          categories: input.categories,
          mediums: input.mediums,
          region: input.region,
          cover_url: input.mediaUrls[0] ?? null,
          moderation_status: input.moderationStatus,
          moderation_reason: input.moderationReason ?? null,
        })
        .select()
        .single();
      if (projectError || !projectData) {
        return { project: null, error: projectError?.message ?? 'Could not create project.' };
      }

      const projectRow = projectData as ProjectRow;

      if (input.mediaUrls.length > 0) {
        const { error: mediaError } = await supabase.from('project_media').insert(
          input.mediaUrls.map((url, index) => ({
            project_id: projectRow.id,
            url,
            position: index,
          })),
        );
        if (mediaError) return { project: null, error: mediaError.message };
      }

      const project = await get().fetchById(projectRow.id);
      return { project, error: project ? null : 'Project was created but could not be reloaded.' };
    },

    updateProject: async (id, input) => {
      const row: Record<string, unknown> = {};
      if (input.title !== undefined) row.title = input.title;
      if (input.description !== undefined) row.description = input.description;
      if (input.categories !== undefined) row.categories = input.categories;
      if (input.mediums !== undefined) row.mediums = input.mediums;
      if (input.moderationStatus !== undefined) row.moderation_status = input.moderationStatus;
      if (input.moderationReason !== undefined) row.moderation_reason = input.moderationReason;

      if (input.mediaUrls !== undefined) {
        row.cover_url = input.mediaUrls[0] ?? null;
        const { error: deleteError } = await supabase.from('project_media').delete().eq('project_id', id);
        if (deleteError) return { project: null, error: deleteError.message };
        if (input.mediaUrls.length > 0) {
          const { error: mediaError } = await supabase
            .from('project_media')
            .insert(input.mediaUrls.map((url, index) => ({ project_id: id, url, position: index })));
          if (mediaError) return { project: null, error: mediaError.message };
        }
      }

      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from('projects').update(row).eq('id', id);
        if (error) return { project: null, error: error.message };
      }

      const project = await get().fetchById(id);
      return { project, error: project ? null : 'Project was updated but could not be reloaded.' };
    },

    appreciate: async (projectId, userId) => {
      const { error } = await supabase
        .from('appreciations')
        .insert({ project_id: projectId, creator_id: userId });
      if (error) return;
      set((state) => {
        const project = state.projectsById[projectId];
        if (!project) return {};
        return {
          projectsById: {
            ...state.projectsById,
            [projectId]: { ...project, appreciations: project.appreciations + 1 },
          },
        };
      });
    },

    unappreciate: async (projectId, userId) => {
      const { error } = await supabase
        .from('appreciations')
        .delete()
        .eq('project_id', projectId)
        .eq('creator_id', userId);
      if (error) return;
      set((state) => {
        const project = state.projectsById[projectId];
        if (!project) return {};
        return {
          projectsById: {
            ...state.projectsById,
            [projectId]: { ...project, appreciations: Math.max(project.appreciations - 1, 0) },
          },
        };
      });
    },

    hasAppreciated: async (projectId, userId) => {
      const { data } = await supabase
        .from('appreciations')
        .select('project_id')
        .eq('project_id', projectId)
        .eq('creator_id', userId)
        .maybeSingle();
      return !!data;
    },

    incrementCommentCount: (projectId) => {
      set((state) => {
        const project = state.projectsById[projectId];
        if (!project) return {};
        return {
          projectsById: {
            ...state.projectsById,
            [projectId]: { ...project, commentCount: project.commentCount + 1 },
          },
        };
      });
    },
  };
});

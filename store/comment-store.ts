import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { commentRowToComment, type CommentRow } from '../lib/supabase/mappers';
import type { Comment } from '../types';
import { useCreatorStore } from './creator-store';
import { useProjectStore } from './project-store';

interface CommentState {
  commentsByProject: Record<string, Comment[]>;
  isLoading: Record<string, boolean>;
  fetchComments: (projectId: string) => Promise<void>;
  addComment: (projectId: string, creatorId: string, text: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set) => ({
  commentsByProject: {},
  isLoading: {},

  fetchComments: async (projectId) => {
    set((state) => ({ isLoading: { ...state.isLoading, [projectId]: true } }));
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    set((state) => ({ isLoading: { ...state.isLoading, [projectId]: false } }));
    if (error || !data) return;

    const rows = data as CommentRow[];
    await useCreatorStore.getState().fetchByIds(rows.map((r) => r.creator_id));
    set((state) => ({
      commentsByProject: { ...state.commentsByProject, [projectId]: rows.map(commentRowToComment) },
    }));
  },

  addComment: async (projectId, creatorId, text) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ project_id: projectId, creator_id: creatorId, text })
      .select()
      .single();
    if (error || !data) return;

    const comment = commentRowToComment(data as CommentRow);
    set((state) => ({
      commentsByProject: {
        ...state.commentsByProject,
        [projectId]: [...(state.commentsByProject[projectId] ?? []), comment],
      },
    }));
    useProjectStore.getState().incrementCommentCount(projectId);
  },
}));

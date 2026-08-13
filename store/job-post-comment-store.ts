import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { jobPostCommentRowToComment, type JobPostCommentRow } from '../lib/supabase/mappers';
import type { JobPostComment } from '../types';
import { useCreatorStore } from './creator-store';
import { useJobPostStore } from './job-post-store';

interface JobPostCommentState {
  commentsByJobPost: Record<string, JobPostComment[]>;
  isLoading: Record<string, boolean>;
  fetchComments: (jobPostId: string) => Promise<void>;
  addComment: (jobPostId: string, creatorId: string, text: string) => Promise<void>;
}

export const useJobPostCommentStore = create<JobPostCommentState>((set) => ({
  commentsByJobPost: {},
  isLoading: {},

  fetchComments: async (jobPostId) => {
    set((state) => ({ isLoading: { ...state.isLoading, [jobPostId]: true } }));
    const { data, error } = await supabase
      .from('job_post_comments')
      .select('*')
      .eq('job_post_id', jobPostId)
      .order('created_at', { ascending: true });
    set((state) => ({ isLoading: { ...state.isLoading, [jobPostId]: false } }));
    if (error || !data) return;

    const rows = data as JobPostCommentRow[];
    await useCreatorStore.getState().fetchByIds(rows.map((r) => r.creator_id));
    set((state) => ({
      commentsByJobPost: { ...state.commentsByJobPost, [jobPostId]: rows.map(jobPostCommentRowToComment) },
    }));
  },

  addComment: async (jobPostId, creatorId, text) => {
    const { data, error } = await supabase
      .from('job_post_comments')
      .insert({ job_post_id: jobPostId, creator_id: creatorId, text })
      .select()
      .single();
    if (error || !data) return;

    const comment = jobPostCommentRowToComment(data as JobPostCommentRow);
    set((state) => ({
      commentsByJobPost: {
        ...state.commentsByJobPost,
        [jobPostId]: [...(state.commentsByJobPost[jobPostId] ?? []), comment],
      },
    }));
    useJobPostStore.setState((state) => {
      const post = state.jobPostsById[jobPostId];
      if (!post) return {};
      return { jobPostsById: { ...state.jobPostsById, [jobPostId]: { ...post, commentCount: post.commentCount + 1 } } };
    });
  },
}));

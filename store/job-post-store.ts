import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { jobPostRowToJobPost, type JobPostRow, type ProfileRow } from '../lib/supabase/mappers';
import type { Category, JobPost, ProductType, Region } from '../types';
import { useCreatorStore } from './creator-store';

const JOB_POST_SELECT = '*, profiles!job_posts_buyer_id_fkey(*), job_post_images(*)';

export interface JobPostFeedFilters {
  category?: Category;
  region?: Region;
  maxBudget?: number;
  deadlineBefore?: string;
}

interface CreateJobPostInput {
  title: string;
  description: string;
  category: Category;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetFlexible: boolean;
  deadline: string | null;
  deliverableType: ProductType;
  region: Region | null;
  imageUrls: string[];
}

interface JobPostState {
  jobPostsById: Record<string, JobPost>;
  isLoadingFeed: boolean;
  fetchFeed: (filters?: JobPostFeedFilters) => Promise<void>;
  fetchById: (id: string) => Promise<JobPost | null>;
  fetchMyJobPosts: (buyerId: string) => Promise<JobPost[]>;
  createJobPost: (
    buyerId: string,
    input: CreateJobPostInput,
  ) => Promise<{ jobPost: JobPost | null; error: string | null }>;
  cancelJobPost: (jobPostId: string) => Promise<{ error: string | null }>;
}

export const useJobPostStore = create<JobPostState>((set, get) => {
  const upsertRows = (rows: JobPostRow[]) => {
    const profiles = rows.map((r) => r.profiles).filter((p): p is ProfileRow => !!p);
    useCreatorStore.getState().upsertFromRows(profiles);

    set((state) => {
      const next = { ...state.jobPostsById };
      for (const row of rows) {
        next[row.id] = jobPostRowToJobPost(row);
      }
      return { jobPostsById: next };
    });
  };

  return {
    jobPostsById: {},
    isLoadingFeed: false,

    fetchFeed: async (filters) => {
      set({ isLoadingFeed: true });
      let query = supabase.from('job_posts').select(JOB_POST_SELECT).eq('status', 'open');

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.region) query = query.eq('region', filters.region);
      if (filters?.maxBudget !== undefined) query = query.lte('budget_min', filters.maxBudget);
      if (filters?.deadlineBefore) query = query.lte('deadline', filters.deadlineBefore);

      const { data, error } = await query.order('created_at', { ascending: false });
      set({ isLoadingFeed: false });
      if (error || !data) return;
      upsertRows(data as JobPostRow[]);
    },

    fetchById: async (id) => {
      const { data, error } = await supabase
        .from('job_posts')
        .select(JOB_POST_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as JobPostRow;
      upsertRows([row]);
      return jobPostRowToJobPost(row);
    },

    fetchMyJobPosts: async (buyerId) => {
      const { data, error } = await supabase
        .from('job_posts')
        .select(JOB_POST_SELECT)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as JobPostRow[];
      upsertRows(rows);
      return rows.map(jobPostRowToJobPost);
    },

    createJobPost: async (buyerId, input) => {
      const { data: postData, error: postError } = await supabase
        .from('job_posts')
        .insert({
          buyer_id: buyerId,
          title: input.title,
          description: input.description,
          category: input.category,
          budget_min: input.budgetMin,
          budget_max: input.budgetMax,
          budget_flexible: input.budgetFlexible,
          deadline: input.deadline,
          deliverable_type: input.deliverableType,
          region: input.region,
        })
        .select()
        .single();
      if (postError || !postData) {
        return { jobPost: null, error: postError?.message ?? 'Could not create job post.' };
      }

      const postRow = postData as JobPostRow;

      if (input.imageUrls.length > 0) {
        const { error: imagesError } = await supabase.from('job_post_images').insert(
          input.imageUrls.map((url, index) => ({
            job_post_id: postRow.id,
            url,
            position: index,
          })),
        );
        if (imagesError) return { jobPost: null, error: imagesError.message };
      }

      const jobPost = await get().fetchById(postRow.id);
      return { jobPost, error: jobPost ? null : 'Job post was created but could not be reloaded.' };
    },

    cancelJobPost: async (jobPostId) => {
      const { error } = await supabase
        .from('job_posts')
        .update({ status: 'cancelled' })
        .eq('id', jobPostId);
      if (error) return { error: error.message };

      set((state) => {
        const post = state.jobPostsById[jobPostId];
        if (!post) return {};
        return { jobPostsById: { ...state.jobPostsById, [jobPostId]: { ...post, status: 'cancelled' } } };
      });
      return { error: null };
    },
  };
});

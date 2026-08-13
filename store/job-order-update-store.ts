import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import {
  jobOrderUpdateCommentRowToComment,
  jobOrderUpdateRowToJobOrderUpdate,
  type JobOrderUpdateCommentRow,
  type JobOrderUpdateRow,
} from '../lib/supabase/mappers';
import type { JobOrderUpdate, JobOrderUpdateComment } from '../types';

const JOB_ORDER_UPDATE_SELECT = '*, job_order_update_images(*)';

interface PostUpdateAttachments {
  filePath?: string;
  fileName?: string;
  imagePaths?: string[];
}

interface JobOrderUpdateState {
  updatesByJobOrder: Record<string, JobOrderUpdate[]>;
  commentsByUpdate: Record<string, JobOrderUpdateComment[]>;
  isLoadingUpdates: Record<string, boolean>;
  isLoadingComments: Record<string, boolean>;
  fetchUpdates: (jobOrderId: string) => Promise<void>;
  postUpdate: (
    jobOrderId: string,
    creatorId: string,
    body: string,
    attachments?: PostUpdateAttachments,
  ) => Promise<{ error: string | null }>;
  fetchComments: (updateId: string) => Promise<void>;
  addComment: (
    jobOrderId: string,
    updateId: string,
    creatorId: string,
    text: string,
  ) => Promise<{ error: string | null }>;
  /** Live-updates the feed and every open comment thread for a job order — so a creator's new
   *  update, or either side's comment on it, shows up for the other without a manual refetch. */
  subscribeToJobOrderUpdates: (jobOrderId: string) => () => void;
}

export const useJobOrderUpdateStore = create<JobOrderUpdateState>((set, get) => ({
  updatesByJobOrder: {},
  commentsByUpdate: {},
  isLoadingUpdates: {},
  isLoadingComments: {},

  fetchUpdates: async (jobOrderId) => {
    set((state) => ({ isLoadingUpdates: { ...state.isLoadingUpdates, [jobOrderId]: true } }));
    const { data, error } = await supabase
      .from('job_order_updates')
      .select(JOB_ORDER_UPDATE_SELECT)
      .eq('job_order_id', jobOrderId)
      .order('created_at', { ascending: false });
    set((state) => ({ isLoadingUpdates: { ...state.isLoadingUpdates, [jobOrderId]: false } }));
    if (error || !data) return;

    set((state) => ({
      updatesByJobOrder: {
        ...state.updatesByJobOrder,
        [jobOrderId]: (data as JobOrderUpdateRow[]).map(jobOrderUpdateRowToJobOrderUpdate),
      },
    }));
  },

  postUpdate: async (jobOrderId, creatorId, body, attachments) => {
    const { data, error } = await supabase
      .from('job_order_updates')
      .insert({
        job_order_id: jobOrderId,
        creator_id: creatorId,
        body,
        file_path: attachments?.filePath ?? null,
        file_name: attachments?.fileName ?? null,
      })
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not post this update.' };

    const updateId = (data as JobOrderUpdateRow).id;
    const imagePaths = attachments?.imagePaths ?? [];

    if (imagePaths.length > 0) {
      const { error: imagesError } = await supabase.from('job_order_update_images').insert(
        imagePaths.map((path, index) => ({
          job_order_id: jobOrderId,
          update_id: updateId,
          path,
          position: index,
        })),
      );
      if (imagesError) return { error: imagesError.message };
    }

    const { data: fullRow, error: reloadError } = await supabase
      .from('job_order_updates')
      .select(JOB_ORDER_UPDATE_SELECT)
      .eq('id', updateId)
      .single();
    if (reloadError || !fullRow) return { error: 'Update was posted but could not be reloaded.' };

    const update = jobOrderUpdateRowToJobOrderUpdate(fullRow as JobOrderUpdateRow);
    set((state) => ({
      updatesByJobOrder: {
        ...state.updatesByJobOrder,
        [jobOrderId]: [update, ...(state.updatesByJobOrder[jobOrderId] ?? [])],
      },
    }));
    return { error: null };
  },

  fetchComments: async (updateId) => {
    set((state) => ({ isLoadingComments: { ...state.isLoadingComments, [updateId]: true } }));
    const { data, error } = await supabase
      .from('job_order_update_comments')
      .select('*')
      .eq('update_id', updateId)
      .order('created_at', { ascending: true });
    set((state) => ({ isLoadingComments: { ...state.isLoadingComments, [updateId]: false } }));
    if (error || !data) return;

    set((state) => ({
      commentsByUpdate: {
        ...state.commentsByUpdate,
        [updateId]: (data as JobOrderUpdateCommentRow[]).map(jobOrderUpdateCommentRowToComment),
      },
    }));
  },

  addComment: async (jobOrderId, updateId, creatorId, text) => {
    const { data, error } = await supabase
      .from('job_order_update_comments')
      .insert({ job_order_id: jobOrderId, update_id: updateId, creator_id: creatorId, text })
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not post this comment.' };

    const comment = jobOrderUpdateCommentRowToComment(data as JobOrderUpdateCommentRow);
    set((state) => {
      const existing = state.commentsByUpdate[updateId] ?? [];
      if (existing.some((c) => c.id === comment.id)) return {};
      return { commentsByUpdate: { ...state.commentsByUpdate, [updateId]: [...existing, comment] } };
    });
    return { error: null };
  },

  subscribeToJobOrderUpdates: (jobOrderId) => {
    const channel = supabase
      .channel(`job-order-updates:${jobOrderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_order_updates', filter: `job_order_id=eq.${jobOrderId}` },
        () => {
          get().fetchUpdates(jobOrderId);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_order_update_comments',
          filter: `job_order_id=eq.${jobOrderId}`,
        },
        (payload) => {
          const updateId = (payload.new as JobOrderUpdateCommentRow).update_id;
          get().fetchComments(updateId);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_order_update_images',
          filter: `job_order_id=eq.${jobOrderId}`,
        },
        () => {
          get().fetchUpdates(jobOrderId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

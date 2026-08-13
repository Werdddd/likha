import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { jobOrderRowToJobOrder, type JobOrderRow } from '../lib/supabase/mappers';
import { getSignedUrl } from '../lib/upload';
import type { Address, JobOrder, JobOrderStatus } from '../types';

const JOB_ORDER_SELECT = '*, job_order_milestones(*)';

interface JobOrderState {
  jobOrders: JobOrder[];
  isLoading: boolean;
  fetchJobOrders: (userId: string) => Promise<void>;
  fetchJobOrderById: (id: string) => Promise<JobOrder | null>;
  acceptOffer: (offerId: string) => Promise<{ jobOrder: JobOrder | null; error: string | null }>;
  uploadMilestoneProof: (
    jobOrderId: string,
    milestoneId: string,
    proofPath: string,
  ) => Promise<{ error: string | null }>;
  releaseMilestone: (jobOrderId: string, milestoneId: string) => Promise<{ error: string | null }>;
  setStatus: (jobOrderId: string, status: JobOrderStatus) => Promise<{ error: string | null }>;
  setAddress: (jobOrderId: string, address: Address) => Promise<{ error: string | null }>;
  uploadFinalFile: (jobOrderId: string, path: string, fileName: string) => Promise<{ error: string | null }>;
  getFinalFileDownloadUrl: (jobOrderId: string) => Promise<string | null>;
}

export const useJobOrderStore = create<JobOrderState>((set, get) => {
  const upsert = (order: JobOrder) => {
    set((state) => {
      const exists = state.jobOrders.some((o) => o.id === order.id);
      return {
        jobOrders: exists
          ? state.jobOrders.map((o) => (o.id === order.id ? order : o))
          : [order, ...state.jobOrders],
      };
    });
  };

  const refresh = async (jobOrderId: string) => {
    const { data, error } = await supabase
      .from('job_orders')
      .select(JOB_ORDER_SELECT)
      .eq('id', jobOrderId)
      .maybeSingle();
    if (error || !data) return null;
    const order = jobOrderRowToJobOrder(data as JobOrderRow);
    upsert(order);
    return order;
  };

  return {
    jobOrders: [],
    isLoading: false,

    fetchJobOrders: async (userId) => {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('job_orders')
        .select(JOB_ORDER_SELECT)
        .or(`buyer_id.eq.${userId},creator_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      set({ isLoading: false });
      if (error || !data) return;
      set({ jobOrders: (data as JobOrderRow[]).map(jobOrderRowToJobOrder) });
    },

    fetchJobOrderById: async (id) => refresh(id),

    acceptOffer: async (offerId) => {
      const { data, error } = await supabase.rpc('accept_job_offer', { p_offer_id: offerId });
      if (error || !data) {
        return { jobOrder: null, error: error?.message ?? 'Could not accept this offer.' };
      }

      const orderId = (data as JobOrderRow).id;
      const jobOrder = await refresh(orderId);
      return { jobOrder, error: jobOrder ? null : 'Offer accepted but the order could not be reloaded.' };
    },

    uploadMilestoneProof: async (jobOrderId, milestoneId, proofPath) => {
      const { error } = await supabase
        .from('job_order_milestones')
        .update({ status: 'paid', payment_proof_path: proofPath })
        .eq('id', milestoneId);
      if (error) return { error: error.message };
      await refresh(jobOrderId);
      return { error: null };
    },

    releaseMilestone: async (jobOrderId, milestoneId) => {
      const { error } = await supabase
        .from('job_order_milestones')
        .update({ status: 'released' })
        .eq('id', milestoneId);
      if (error) return { error: error.message };
      await refresh(jobOrderId);
      return { error: null };
    },

    setStatus: async (jobOrderId, status) => {
      const { error } = await supabase.from('job_orders').update({ status }).eq('id', jobOrderId);
      if (error) return { error: error.message };
      await refresh(jobOrderId);
      return { error: null };
    },

    setAddress: async (jobOrderId, address) => {
      const { error } = await supabase.from('job_orders').update({ address }).eq('id', jobOrderId);
      if (error) return { error: error.message };
      await refresh(jobOrderId);
      return { error: null };
    },

    uploadFinalFile: async (jobOrderId, path, fileName) => {
      const { error } = await supabase
        .from('job_orders')
        .update({ final_file_path: path, final_file_name: fileName })
        .eq('id', jobOrderId);
      if (error) return { error: error.message };
      await refresh(jobOrderId);
      return { error: null };
    },

    getFinalFileDownloadUrl: async (jobOrderId) => {
      const order = get().jobOrders.find((o) => o.id === jobOrderId);
      if (!order?.finalFilePath) return null;
      return getSignedUrl('job-deliverables', order.finalFilePath);
    },
  };
});

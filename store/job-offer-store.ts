import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { jobOfferRowToJobOffer, type JobOfferRow } from '../lib/supabase/mappers';
import type { JobOffer } from '../types';

const JOB_OFFER_SELECT = '*';

interface SubmitOfferInput {
  price: number;
  turnaroundDays: number;
  pitch: string;
  portfolioProjectId?: string;
}

interface JobOfferState {
  offersByJobPost: Record<string, JobOffer[]>;
  myOffers: JobOffer[];
  isLoading: Record<string, boolean>;
  fetchOffersForPost: (jobPostId: string) => Promise<void>;
  fetchMyOffers: (creatorId: string) => Promise<void>;
  submitOffer: (
    jobPostId: string,
    creatorId: string,
    input: SubmitOfferInput,
  ) => Promise<{ offer: JobOffer | null; error: string | null }>;
  withdrawOffer: (offerId: string) => Promise<{ error: string | null }>;
}

export const useJobOfferStore = create<JobOfferState>((set) => ({
  offersByJobPost: {},
  myOffers: [],
  isLoading: {},

  fetchOffersForPost: async (jobPostId) => {
    set((state) => ({ isLoading: { ...state.isLoading, [jobPostId]: true } }));
    const { data, error } = await supabase
      .from('job_offers')
      .select(JOB_OFFER_SELECT)
      .eq('job_post_id', jobPostId)
      .order('created_at', { ascending: true });
    set((state) => ({ isLoading: { ...state.isLoading, [jobPostId]: false } }));
    if (error || !data) return;

    set((state) => ({
      offersByJobPost: {
        ...state.offersByJobPost,
        [jobPostId]: (data as JobOfferRow[]).map(jobOfferRowToJobOffer),
      },
    }));
  },

  fetchMyOffers: async (creatorId) => {
    const { data, error } = await supabase
      .from('job_offers')
      .select(JOB_OFFER_SELECT)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    if (error || !data) return;
    set({ myOffers: (data as JobOfferRow[]).map(jobOfferRowToJobOffer) });
  },

  submitOffer: async (jobPostId, creatorId, input) => {
    const { data, error } = await supabase
      .from('job_offers')
      .insert({
        job_post_id: jobPostId,
        creator_id: creatorId,
        price: input.price,
        turnaround_days: input.turnaroundDays,
        pitch: input.pitch,
        portfolio_project_id: input.portfolioProjectId ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      return { offer: null, error: error?.message ?? 'Could not submit offer.' };
    }

    const offer = jobOfferRowToJobOffer(data as JobOfferRow);
    set((state) => ({
      offersByJobPost: {
        ...state.offersByJobPost,
        [jobPostId]: [...(state.offersByJobPost[jobPostId] ?? []), offer],
      },
      myOffers: [offer, ...state.myOffers],
    }));
    return { offer, error: null };
  },

  withdrawOffer: async (offerId) => {
    const { error } = await supabase.from('job_offers').update({ status: 'withdrawn' }).eq('id', offerId);
    if (error) return { error: error.message };

    const patch = (offer: JobOffer): JobOffer => (offer.id === offerId ? { ...offer, status: 'withdrawn' } : offer);
    set((state) => ({
      offersByJobPost: Object.fromEntries(
        Object.entries(state.offersByJobPost).map(([jobPostId, offers]) => [jobPostId, offers.map(patch)]),
      ),
      myOffers: state.myOffers.map(patch),
    }));
    return { error: null };
  },
}));

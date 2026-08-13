import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { jobOfferRowToJobOffer, type JobOfferRow } from '../lib/supabase/mappers';
import type { JobOffer } from '../types';

const JOB_OFFER_SELECT = '*';

function patchOfferStatus(offers: JobOffer[], offerId: string, status: JobOffer['status']): JobOffer[] {
  return offers.map((offer) => (offer.id === offerId ? { ...offer, status } : offer));
}

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
  /** Buyer dismissing an individual pending offer on their own post, independent of accepting
   *  another one. */
  rejectOffer: (offerId: string) => Promise<{ error: string | null }>;
  /** Live-updates the offer list for a post — so the buyer sees new offers arrive, and every
   *  creator who offered sees accept/not-selected status changes, without a manual refetch. */
  subscribeToJobPostOffers: (jobPostId: string) => () => void;
}

export const useJobOfferStore = create<JobOfferState>((set, get) => ({
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

    set((state) => ({
      offersByJobPost: Object.fromEntries(
        Object.entries(state.offersByJobPost).map(([jobPostId, offers]) => [
          jobPostId,
          patchOfferStatus(offers, offerId, 'withdrawn'),
        ]),
      ),
      myOffers: patchOfferStatus(state.myOffers, offerId, 'withdrawn'),
    }));
    return { error: null };
  },

  rejectOffer: async (offerId) => {
    const { error } = await supabase.from('job_offers').update({ status: 'not_selected' }).eq('id', offerId);
    if (error) return { error: error.message };

    set((state) => ({
      offersByJobPost: Object.fromEntries(
        Object.entries(state.offersByJobPost).map(([jobPostId, offers]) => [
          jobPostId,
          patchOfferStatus(offers, offerId, 'not_selected'),
        ]),
      ),
      myOffers: patchOfferStatus(state.myOffers, offerId, 'not_selected'),
    }));
    return { error: null };
  },

  subscribeToJobPostOffers: (jobPostId) => {
    const channel = supabase
      .channel(`job-offers:${jobPostId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_offers', filter: `job_post_id=eq.${jobPostId}` },
        () => {
          get().fetchOffersForPost(jobPostId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

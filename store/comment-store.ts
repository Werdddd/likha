import { create } from 'zustand';

import { comments as mockComments } from '../constants/mock-data';
import type { Comment } from '../types';

interface CommentState {
  comments: Comment[];
  getCommentCount: (projectId: string) => number;
  addComment: (projectId: string, creatorId: string, text: string) => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [...mockComments],
  getCommentCount: (projectId) => get().comments.filter((c) => c.projectId === projectId).length,
  addComment: (projectId, creatorId, text) =>
    set((state) => ({
      comments: [
        ...state.comments,
        {
          id: `cm-${projectId}-${Date.now()}`,
          projectId,
          creatorId,
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
}));

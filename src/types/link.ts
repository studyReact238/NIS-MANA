
export type LinkColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

export type LinkStatus = 'unstarted' | 'learning' | 'completed';

export interface LearningLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  status: LinkStatus; // ユーザー個別のステータス
  userVote?: 'up' | 'down' | null;
  color: LinkColor;
  icon: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  completedCount: number;
  upvoteCount: number;
  downvoteCount: number;
}

export type SortOption = 'title-asc' | 'title-desc' | 'date-new' | 'date-old' | 'rating-high';

export type StatusFilter = 'all' | LinkStatus;

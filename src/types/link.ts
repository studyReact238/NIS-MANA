
export type LinkColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

export interface LearningLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  isCompleted: boolean; // UI上でマージされる項目
  userVote?: 'up' | 'down' | null; // UI上でマージされる項目
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

export type StatusFilter = 'all' | 'learning' | 'completed';

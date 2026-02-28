
export type LinkColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

export interface LearningLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  isCompleted: boolean; // UI上でマージされる項目
  color: LinkColor;
  icon: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type SortOption = 'title-asc' | 'title-desc' | 'date-new' | 'date-old';

export type StatusFilter = 'all' | 'learning' | 'completed';

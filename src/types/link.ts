
export type LinkColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

export type LinkStatus = 'unstarted' | 'learning' | 'completed';

export interface LearningLink {
  id: string;
  title: string;
  url: string;
  testUrl?: string; // 確認テストのURL
  testHtml?: string; // 直接アップロードされたHTML
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
  learningCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isRecommended?: boolean; // 推奨コンテンツ判定
}

export type SortOption = 'title-asc' | 'title-desc' | 'date-new' | 'date-old' | 'rating-high' | 'learning-high';

export type StatusFilter = 'all' | LinkStatus;

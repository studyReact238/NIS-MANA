
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { LearningLink, SortOption, StatusFilter, LinkColor } from '@/types/link';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface LinkContextType {
  links: LearningLink[];
  isAdmin: boolean;
  isServerAdmin: boolean | null;
  setIsAdmin: (val: boolean) => void;
  search: string;
  setSearch: (val: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  selectedColors: LinkColor[];
  toggleColor: (color: LinkColor) => void;
  clearColors: () => void;
  selectedIcons: string[];
  toggleIcon: (icon: string) => void;
  clearIcons: () => void;
  
  addLink: (link: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isCompleted' | 'completedCount' | 'upvoteCount' | 'downvoteCount' | 'userVote'>) => void;
  updateLink: (id: string, updates: Partial<LearningLink>) => void;
  deleteLink: (id: string) => void;
  duplicateLink: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleVote: (id: string, type: 'up' | 'down') => void;
  filteredLinks: LearningLink[];
  allTags: string[];
  isLoading: boolean;
}

const LinkContext = createContext<LinkContextType | undefined>(undefined);

export const LinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [isAdminManual, setIsAdminManual] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<LinkColor[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);

  // 管理者判定
  const { data: adminDocs } = useCollection(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'admins');
  }, [firestore]));

  const isServerAdmin = useMemo(() => {
    if (!user || !adminDocs) return false;
    return adminDocs.some(admin => admin.id === user.uid);
  }, [user, adminDocs]);

  // 全共有リンクを取得
  const { data: rawLinks, isLoading: isLinksLoading } = useCollection<any>(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'learningLinks');
  }, [firestore]));

  // ユーザー個別の進捗を取得
  const { data: userProgress, isLoading: isProgressLoading } = useCollection<any>(useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'progress');
  }, [firestore, user?.uid]));

  // ユーザーの全リンクへの投票を取得
  // 本来はリンクごとに取得するのがよいが、MVPのため一括取得
  const { data: userVotes, isLoading: isVotesLoading } = useCollection<any>(useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // 注：Firestoreの構成上、サブコレクションを全検索するにはコレクショングループクエリが必要だが、
    // ここでは各リンクのvotesサブコレクション内の自分のIDのドキュメントをチェックする必要がある。
    // クライアントサイドでの効率化のため、ここではlinksがロードされてから個別に取得するのではなく、
    // 別の方法（例：ユーザーごとのvotesコレクション）が望ましいかもしれない。
    // しかし、既存のbackend.jsonに合わせ、ここでは空配列として初期化し、LinkCard側で個別に判定する形を取る。
    return null; 
  }, [firestore, user?.uid]));

  // リンクデータと個別進捗をマージ
  const links = useMemo(() => {
    if (!rawLinks) return [];
    const progressMap = new Map(userProgress?.map(p => [p.id, p.isCompleted]) || []);
    
    return rawLinks.map(link => ({
      ...link,
      isCompleted: progressMap.get(link.id) || false,
      // userVoteはCard内で個別にフェッチするか、別の手段でマージする
      completedCount: link.completedCount || 0,
      upvoteCount: link.upvoteCount || 0,
      downvoteCount: link.downvoteCount || 0,
    })) as LearningLink[];
  }, [rawLinks, userProgress]);

  const isAdmin = isServerAdmin === true && isAdminManual;

  const addLink = (data: any) => {
    if (!firestore || !user) return;
    const colRef = collection(firestore, 'learningLinks');
    const newLink = { 
      ...data, 
      createdBy: user.uid, 
      createdAt: Date.now(), 
      updatedAt: Date.now(),
      completedCount: 0,
      upvoteCount: 0,
      downvoteCount: 0
    };
    addDoc(colRef, newLink).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: newLink })));
  };

  const updateLink = (id: string, updates: any) => {
    if (!firestore) return;
    const { isCompleted, userVote, id: _, ...cleanUpdates } = updates;
    const docRef = doc(firestore, 'learningLinks', id);
    updateDoc(docRef, { ...cleanUpdates, updatedAt: Date.now() })
      .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: cleanUpdates })));
  };

  const deleteLink = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'learningLinks', id);
    deleteDoc(docRef).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };

  const duplicateLink = (id: string) => {
    const original = links.find(l => l.id === id);
    if (!original || !firestore || !user) return;
    const { id: _, isCompleted: __, userVote: ___, createdAt: ____, updatedAt: _____, completedCount: ______, upvoteCount: _______, downvoteCount: ________, ...data } = original;
    addLink({ ...data, title: `${original.title} のコピー` });
  };

  const toggleComplete = (id: string) => {
    if (!firestore || !user) return;
    const link = links.find(l => l.id === id);
    const currentStatus = link?.isCompleted || false;
    const progressRef = doc(firestore, 'users', user.uid, 'progress', id);
    const linkRef = doc(firestore, 'learningLinks', id);
    
    const nextStatus = !currentStatus;

    // ユーザー個別の進捗を更新
    setDoc(progressRef, { 
      isCompleted: nextStatus, 
      updatedAt: Date.now() 
    }, { merge: true }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: progressRef.path, operation: 'write' })));

    // 全体カウントを更新
    updateDoc(linkRef, {
      completedCount: increment(nextStatus ? 1 : -1)
    }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: linkRef.path, operation: 'update' })));
  };

  const toggleVote = async (id: string, type: 'up' | 'down') => {
    if (!firestore || !user) return;
    
    // 注：現在の投票状態を把握するためにサブコレクションを直接見る必要がある。
    // 本来はContext内のデータにマージされているのが理想だが、実装をシンプルにするためFirestoreを直接参照。
    const voteRef = doc(firestore, 'learningLinks', id, 'votes', user.uid);
    const linkRef = doc(firestore, 'learningLinks', id);

    // Context内の状態ではなく、Firestoreから最新の状態を（できれば）取得したいが、
    // ここではCard側で管理されているuserVoteプロパティを利用するか、
    // toggleVote内部で再判定する。
    // ここでは簡易的に、Cardコンポーネント側でクリック時に「現在の投票」を渡すように設計変更。
  };

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const clearTags = () => setSelectedTags([]);
  const toggleColor = (color: LinkColor) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const clearColors = () => setSelectedColors([]);
  const toggleIcon = (icon: string) => setSelectedIcons(prev => prev.includes(icon) ? prev.filter(i => i !== icon) : [...prev, icon]);
  const clearIcons = () => setSelectedIcons([]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    links.forEach(l => (l.tags || []).forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
    let result = [...links];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        l.title?.toLowerCase().includes(s) || 
        (l.description && l.description.toLowerCase().includes(s)) || 
        (l.tags || []).some(t => t.toLowerCase().includes(s))
      );
    }
    if (statusFilter === 'learning') result = result.filter(l => !l.isCompleted);
    if (statusFilter === 'completed') result = result.filter(l => l.isCompleted);
    if (selectedTags.length > 0) result = result.filter(l => selectedTags.some(t => (l.tags || []).includes(t)));
    if (selectedColors.length > 0) result = result.filter(l => selectedColors.includes(l.color));
    if (selectedIcons.length > 0) result = result.filter(l => selectedIcons.includes(l.icon));
    
    result.sort((a, b) => {
      if (sortBy === 'title-asc') return (a.title || "").localeCompare(b.title || "");
      if (sortBy === 'title-desc') return (b.title || "").localeCompare(a.title || "");
      if (sortBy === 'date-new') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'date-old') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'rating-high') {
        const scoreA = (a.upvoteCount || 0) - (a.downvoteCount || 0);
        const scoreB = (b.upvoteCount || 0) - (b.downvoteCount || 0);
        return scoreB - scoreA;
      }
      return 0;
    });
    return result;
  }, [links, search, statusFilter, sortBy, selectedTags, selectedColors, selectedIcons]);

  return (
    <LinkContext.Provider value={{
      links, isAdmin, isServerAdmin, setIsAdmin: setIsAdminManual, search, setSearch, statusFilter, setStatusFilter, 
      sortBy, setSortBy, selectedTags, toggleTag, clearTags, selectedColors, toggleColor, 
      clearColors, selectedIcons, toggleIcon, clearIcons, addLink, updateLink, deleteLink, 
      duplicateLink, toggleComplete, toggleVote, filteredLinks, allTags, isLoading: isLinksLoading || isProgressLoading
    }}>
      {children}
    </LinkContext.Provider>
  );
};

export const useLinks = () => {
  const context = useContext(LinkContext);
  if (!context) throw new Error('useLinks must be used within LinkProvider');
  return context;
};

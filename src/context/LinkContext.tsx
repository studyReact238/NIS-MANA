
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { LearningLink, SortOption, StatusFilter, LinkColor, LinkStatus } from '@/types/link';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  increment,
  query,
  limit,
  orderBy,
  getDocs,
  writeBatch
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
  
  addLink: (link: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status' | 'completedCount' | 'learningCount' | 'upvoteCount' | 'downvoteCount' | 'userVote'>) => void;
  updateLink: (id: string, updates: Partial<LearningLink>) => void;
  deleteLink: (id: string) => void;
  duplicateLink: (id: string) => void;
  updateStatus: (id: string, status: LinkStatus) => void;
  recalculateAllCounts: () => Promise<void>;
  filteredLinks: LearningLink[];
  allTags: string[];
  isLoading: boolean;
  activities: any[];
  timelineLimit: number;
  setTimelineLimit: (val: number) => void;
  adminDocs: any[] | null;
  totalUserCount: number;
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
  const [timelineLimit, setTimelineLimit] = useState(10);

  // ログイン時にユーザー情報を確実に保存/更新
  useEffect(() => {
    if (!firestore || !user) return;
    
    const userRef = doc(firestore, 'users', user.uid);
    setDoc(userRef, {
      id: user.uid,
      email: user.email,
      lastLoginAt: Date.now()
    }, { merge: true });
  }, [firestore, user]);

  const { data: adminDocs } = useCollection(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'admins');
  }, [firestore]));

  const { data: allUsers } = useCollection(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]));

  const isServerAdmin = useMemo(() => {
    if (!user) return false;
    if (!adminDocs) return null;
    return adminDocs.some(admin => admin.id === user.uid);
  }, [user, adminDocs]);

  const { data: rawLinks, isLoading: isLinksLoading } = useCollection<any>(useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'learningLinks');
  }, [firestore]));

  const { data: userProgress, isLoading: isProgressLoading } = useCollection<any>(useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'progress');
  }, [firestore, user?.uid]));

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseQuery = collection(firestore, 'activities');
    if (timelineLimit > 0) {
      return query(baseQuery, orderBy('timestamp', 'desc'), limit(timelineLimit));
    }
    return query(baseQuery, orderBy('timestamp', 'desc'));
  }, [firestore, timelineLimit]);

  const { data: activities } = useCollection<any>(activitiesQuery);

  const links = useMemo(() => {
    if (!rawLinks) return [];
    const progressMap = new Map(userProgress?.map(p => [p.id, p.status]) || []);
    const totalUsers = allUsers?.length || 1;
    
    return rawLinks.map(link => {
      const upvotes = Math.max(0, link.upvoteCount || 0);
      const downvotes = Math.max(0, link.downvoteCount || 0);
      
      // 推奨判定ロジック:
      // 1. 高評価数が登録ユーザーの10%以上
      // 2. 高評価数が低評価数より多い
      const isRecommended = upvotes >= (totalUsers * 0.1) && upvotes > downvotes;

      return {
        ...link,
        status: progressMap.get(link.id) || 'unstarted',
        completedCount: Math.max(0, link.completedCount || 0),
        learningCount: Math.max(0, link.learningCount || 0),
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        isRecommended
      };
    }) as LearningLink[];
  }, [rawLinks, userProgress, allUsers]);

  const isAdmin = isServerAdmin === true && isAdminManual;

  const logActivity = (type: string, linkId: string, linkTitle: string) => {
    if (!firestore || !user) return;
    const activityRef = collection(firestore, 'activities');
    const isAdminUser = adminDocs?.some(a => a.id === user.uid) || false;

    addDoc(activityRef, {
      type,
      linkId,
      linkTitle,
      timestamp: Date.now(),
      userId: user.uid,
      userEmail: user.email || '',
      isAdmin: isAdminUser
    }).catch(e => {
      console.error('Activity logging failed:', e);
    });
  };

  const addLink = (data: any) => {
    if (!firestore || !user) return;
    const colRef = collection(firestore, 'learningLinks');
    const newLink = { 
      ...data, 
      createdBy: user.uid, 
      createdAt: Date.now(), 
      updatedAt: Date.now(),
      completedCount: 0,
      learningCount: 0,
      upvoteCount: 0,
      downvoteCount: 0
    };
    
    addDoc(colRef, newLink).then((docRef) => {
      logActivity('link_added', docRef.id, data.title);
    }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: newLink })));
  };

  const updateLink = (id: string, updates: any) => {
    if (!firestore || !user) return;
    const { status, userVote, id: _, isRecommended: __, ...cleanUpdates } = updates;
    const docRef = doc(firestore, 'learningLinks', id);

    updateDoc(docRef, { ...cleanUpdates, updatedAt: Date.now() })
      .then(() => {
        logActivity('link_updated', id, cleanUpdates.title || '（タイトル不明）');
      })
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
    const { id: _, status: __, userVote: ___, createdAt: ____, updatedAt: _____, completedCount: ______, learningCount: _______, upvoteCount: ________, downvoteCount: _________, isRecommended: __________, ...data } = original;
    addLink({ ...data, title: `${original.title} のコピー` });
  };

  const updateStatus = (id: string, nextStatus: LinkStatus) => {
    if (!firestore || !user) return;
    const link = links.find(l => l.id === id);
    if (!link) return;

    const oldStatus = link.status;
    if (oldStatus === nextStatus) return;

    const progressRef = doc(firestore, 'users', user.uid, 'progress', id);
    const linkRef = doc(firestore, 'learningLinks', id);
    const completionRef = doc(firestore, 'learningLinks', id, 'completions', user.uid);
    const learnerRef = doc(firestore, 'learningLinks', id, 'learners', user.uid);
    
    setDoc(progressRef, { 
      status: nextStatus, 
      updatedAt: Date.now() 
    }, { merge: true }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: progressRef.path, operation: 'write' })));

    const updates: any = {};

    if (oldStatus === 'completed') {
      updates.completedCount = increment(-1);
      deleteDoc(completionRef);
    } else if (oldStatus === 'learning') {
      updates.learningCount = increment(-1);
      deleteDoc(learnerRef);
    }

    if (nextStatus === 'completed') {
      updates.completedCount = increment(1);
      setDoc(completionRef, {
        email: user.email,
        completedAt: Date.now()
      }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: completionRef.path, operation: 'create' })));

      logActivity('completion', link.id, link.title);
    } else if (nextStatus === 'learning') {
      updates.learningCount = increment(1);
      setDoc(learnerRef, {
        email: user.email,
        startedAt: Date.now()
      }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: learnerRef.path, operation: 'create' })));

      logActivity('learning_started', link.id, link.title);
    }

    if (Object.keys(updates).length > 0) {
      updateDoc(linkRef, updates).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: linkRef.path, operation: 'update' })));
    }
  };

  const recalculateAllCounts = async () => {
    if (!firestore) return;
    if (!isServerAdmin) throw new Error('権限がありません。');

    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const linksSnap = await getDocs(collection(firestore, 'learningLinks'));
      const countsMap = new Map<string, { learning: number, completed: number }>();
      const userEmailsMap = new Map<string, string>();
      
      usersSnap.docs.forEach(d => userEmailsMap.set(d.id, d.data().email));
      linksSnap.docs.forEach(d => countsMap.set(d.id, { learning: 0, completed: 0 }));

      for (const userId of Array.from(userEmailsMap.keys())) {
        const userEmail = userEmailsMap.get(userId);
        const progressSnap = await getDocs(collection(firestore, 'users', userId, 'progress'));
        for (const pDoc of progressSnap.docs) {
          const linkId = pDoc.id;
          const status = pDoc.data().status;
          const updatedAt = pDoc.data().updatedAt || Date.now();
          const current = countsMap.get(linkId);
          if (current) {
            if (status === 'learning') {
              current.learning++;
              await setDoc(doc(firestore, 'learningLinks', linkId, 'learners', userId), { email: userEmail, startedAt: updatedAt }, { merge: true });
            } else if (status === 'completed') {
              current.completed++;
              await setDoc(doc(firestore, 'learningLinks', linkId, 'completions', userId), { email: userEmail, completedAt: updatedAt }, { merge: true });
            }
          }
        }
      }

      const batch = writeBatch(firestore);
      countsMap.forEach((counts, linkId) => {
        batch.set(doc(firestore, 'learningLinks', linkId), { learningCount: counts.learning, completedCount: counts.completed }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Recalculation failed:', error);
      throw error;
    }
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
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (selectedTags.length > 0) result = result.filter(l => selectedTags.some(t => (l.tags || []).includes(t)));
    if (selectedColors.length > 0) result = result.filter(l => selectedColors.includes(l.color));
    if (selectedIcons.length > 0) result = result.filter(l => selectedIcons.includes(l.icon));
    
    result.sort((a, b) => {
      if (sortBy === 'title-asc') return (a.title || "").localeCompare(b.title || "");
      if (sortBy === 'title-desc') return (b.title || "").localeCompare(a.title || "");
      if (sortBy === 'date-new') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'date-old') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'learning-high') return (b.learningCount || 0) - (a.learningCount || 0);
      if (sortBy === 'rating-high') return ((b.upvoteCount || 0) - (b.downvoteCount || 0)) - ((a.upvoteCount || 0) - (a.downvoteCount || 0));
      return 0;
    });
    return result;
  }, [links, search, statusFilter, sortBy, selectedTags, selectedColors, selectedIcons]);

  return (
    <LinkContext.Provider value={{
      links, isAdmin, isServerAdmin, setIsAdmin: setIsAdminManual, search, setSearch, statusFilter, setStatusFilter, 
      sortBy, setSortBy, selectedTags, toggleTag, clearTags, selectedColors, toggleColor, 
      clearColors, selectedIcons, toggleIcon, clearIcons, addLink, updateLink, deleteLink, 
      duplicateLink, updateStatus, recalculateAllCounts, filteredLinks, allTags, isLoading: isLinksLoading || isProgressLoading,
      activities: activities || [], timelineLimit, setTimelineLimit, adminDocs: adminDocs || [],
      totalUserCount: allUsers?.length || 0
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

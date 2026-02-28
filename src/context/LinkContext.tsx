
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
  setDoc
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
  
  addLink: (link: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isCompleted'>) => void;
  updateLink: (id: string, updates: Partial<LearningLink>) => void;
  deleteLink: (id: string) => void;
  duplicateLink: (id: string) => void;
  toggleComplete: (id: string) => void;
  filteredLinks: LearningLink[];
  allTags: string[];
  isLoading: boolean;
}

const LinkContext = createContext<LinkContextType | undefined>(undefined);

export const LinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  
  const [isAdminManual, setIsAdminManual] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<LinkColor[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);

  // 管理者判定
  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'admins', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: adminDoc } = useCollection(useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'admins');
  }, [firestore, user?.uid]));

  const isServerAdmin = useMemo(() => {
    if (!user || !adminDoc) return false;
    return adminDoc.some(admin => admin.id === user.uid);
  }, [user, adminDoc]);

  // 全共有リンクを取得
  const linksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'learningLinks');
  }, [firestore]);

  const { data: rawLinks, isLoading: isLinksLoading } = useCollection<any>(linksQuery);

  // ユーザー個別の進捗を取得
  const progressQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'progress');
  }, [firestore, user?.uid]);

  const { data: userProgress, isLoading: isProgressLoading } = useCollection<any>(progressQuery);

  // リンクデータと個別進捗をマージ
  const links = useMemo(() => {
    if (!rawLinks) return [];
    const progressMap = new Map(userProgress?.map(p => [p.id, p.isCompleted]) || []);
    
    return rawLinks.map(link => ({
      ...link,
      isCompleted: progressMap.get(link.id) || false
    })) as LearningLink[];
  }, [rawLinks, userProgress]);

  const isAdmin = isServerAdmin === true && isAdminManual;

  const addLink = (data: any) => {
    if (!firestore || !user) return;
    const colRef = collection(firestore, 'learningLinks');
    addDoc(colRef, { 
      ...data, 
      createdBy: user.uid, 
      createdAt: Date.now(), 
      updatedAt: Date.now() 
    }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data })));
  };

  const updateLink = (id: string, updates: any) => {
    if (!firestore) return;
    const { isCompleted, ...cleanUpdates } = updates; // 進捗はここでは更新しない
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
    const { id: _, isCompleted: __, ...data } = original;
    addLink({ ...data, title: `${original.title} のコピー` });
  };

  const toggleComplete = (id: string) => {
    if (!firestore || !user) return;
    const currentStatus = links.find(l => l.id === id)?.isCompleted || false;
    const progressRef = doc(firestore, 'users', user.uid, 'progress', id);
    
    setDoc(progressRef, { 
      isCompleted: !currentStatus, 
      updatedAt: Date.now() 
    }, { merge: true }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: progressRef.path, operation: 'write' })));
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
      return 0;
    });
    return result;
  }, [links, search, statusFilter, sortBy, selectedTags, selectedColors, selectedIcons]);

  return (
    <LinkContext.Provider value={{
      links, isAdmin, isServerAdmin, setIsAdmin: setIsAdminManual, search, setSearch, statusFilter, setStatusFilter, 
      sortBy, setSortBy, selectedTags, toggleTag, clearTags, selectedColors, toggleColor, 
      clearColors, selectedIcons, toggleIcon, clearIcons, addLink, updateLink, deleteLink, 
      duplicateLink, toggleComplete, filteredLinks, allTags, isLoading: isLinksLoading || isProgressLoading
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


"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { LearningLink, SortOption, StatusFilter, LinkColor } from '@/types/link';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface LinkContextType {
  links: LearningLink[];
  isAdmin: boolean;
  isServerAdmin: boolean | null; // null: loading, boolean: loaded
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
  
  addLink: (link: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
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
  const { firestore } = useFirestore();
  const { user } = useUser();
  const { firebaseApp } = useFirebaseApp();
  
  // UI States
  const [isAdminManual, setIsAdminManual] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<LinkColor[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);

  // Firestore Queries
  const linksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'learningLinks');
  }, [firestore, user?.uid]);

  const { data: firestoreLinks, isLoading: isLinksLoading } = useCollection<LearningLink>(linksQuery);

  // Admin Check
  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    // 空白除去を徹底
    return doc(firestore, 'admins', user.uid.trim());
  }, [firestore, user?.uid]);
  
  const { data: adminDoc, isLoading: isAdminLoading, error: adminError } = useDoc(adminDocRef);
  
  // 管理者かどうかを判定
  const isServerAdmin = useMemo(() => {
    if (isAdminLoading) return null;
    if (adminError) {
      console.error('--- ADMIN CHECK ERROR ---', adminError);
      return false;
    }
    // ドキュメントが存在すれば管理者
    return adminDoc !== null;
  }, [adminDoc, isAdminLoading, adminError]);

  // デバッグ用ログ出力をさらに強化
  useEffect(() => {
    if (user && firebaseApp) {
      console.group('--- Firebase Connection Debug ---');
      console.log('Project ID (Config):', firebaseApp.options.projectId);
      console.log('User UID:', user.uid);
      console.log('Admin Path Attempted:', `admins/${user.uid.trim()}`);
      console.log('Admin Doc Loading:', isAdminLoading);
      console.log('Admin Doc Found:', adminDoc !== null);
      console.log('Final isServerAdmin Result:', isServerAdmin);
      if (adminError) console.log('Permission Error Details:', adminError);
      console.groupEnd();
    }
  }, [user, isServerAdmin, adminDoc, isAdminLoading, adminError, firebaseApp]);

  const isAdmin = isServerAdmin === true && isAdminManual;
  const links = useMemo(() => firestoreLinks || [], [firestoreLinks]);

  const addLink = (data: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!firestore || !user) return;
    const colRef = collection(firestore, 'users', user.uid, 'learningLinks');
    
    addDoc(colRef, {
      ...data,
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data
      }));
    });
  };

  const updateLink = (id: string, updates: Partial<LearningLink>) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'learningLinks', id);
    
    updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const deleteLink = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'learningLinks', id);
    
    deleteDoc(docRef).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
  };

  const duplicateLink = (id: string) => {
    const original = links.find(l => l.id === id);
    if (!original || !firestore || !user) return;
    
    const { id: _, ...data } = original;
    addLink({
      ...data,
      title: `${original.title} のコピー`,
      isCompleted: false,
    });
  };

  const toggleComplete = (id: string) => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    updateLink(id, { isCompleted: !link.isCompleted });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const clearTags = () => setSelectedTags([]);

  const toggleColor = (color: LinkColor) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const clearColors = () => setSelectedColors([]);

  const toggleIcon = (icon: string) => {
    setSelectedIcons(prev => prev.includes(icon) ? prev.filter(i => i !== icon) : [...prev, icon]);
  };

  const clearIcons = () => setSelectedIcons([]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    links.forEach(l => l.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
    let result = [...links];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(s) || 
        (l.description && l.description.toLowerCase().includes(s)) || 
        l.tags.some(t => t.toLowerCase().includes(s))
      );
    }

    if (statusFilter === 'learning') result = result.filter(l => !l.isCompleted);
    if (statusFilter === 'completed') result = result.filter(l => l.isCompleted);

    if (selectedTags.length > 0) {
      result = result.filter(l => selectedTags.some(t => l.tags.includes(t)));
    }

    if (selectedColors.length > 0) {
      result = result.filter(l => selectedColors.includes(l.color));
    }

    if (selectedIcons.length > 0) {
      result = result.filter(l => selectedIcons.includes(l.icon));
    }

    result.sort((a, b) => {
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      if (sortBy === 'date-new') return b.updatedAt - a.updatedAt;
      if (sortBy === 'date-old') return a.updatedAt - b.updatedAt;
      return 0;
    });

    return result;
  }, [links, search, statusFilter, sortBy, selectedTags, selectedColors, selectedIcons]);

  return (
    <LinkContext.Provider value={{
      links, isAdmin, isServerAdmin, setIsAdmin: setIsAdminManual, search, setSearch, statusFilter, setStatusFilter, 
      sortBy, setSortBy, selectedTags, toggleTag, clearTags, selectedColors, toggleColor, 
      clearColors, selectedIcons, toggleIcon, clearIcons, addLink, updateLink, deleteLink, 
      duplicateLink, toggleComplete, filteredLinks, allTags, isLoading: isLinksLoading || (isServerAdmin === null)
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

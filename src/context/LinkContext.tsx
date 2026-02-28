
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { LearningLink, SortOption, StatusFilter, LinkColor } from '@/types/link';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc
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
  
  const [isAdminManual, setIsAdminManual] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<LinkColor[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);

  const linksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'learningLinks');
  }, [firestore, user?.uid]);

  const { data: firestoreLinks, isLoading: isLinksLoading } = useCollection<LearningLink>(linksQuery);

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'admins', user.uid.trim());
  }, [firestore, user?.uid]);
  
  const { data: adminDoc, isLoading: isAdminLoading, error: adminError } = useDoc(adminDocRef);
  
  const isServerAdmin = useMemo(() => {
    if (isAdminLoading) return null;
    if (adminError) return false;
    return adminDoc !== null;
  }, [adminDoc, isAdminLoading, adminError]);

  const isAdmin = isServerAdmin === true && isAdminManual;
  const links = useMemo(() => firestoreLinks || [], [firestoreLinks]);

  const addLink = (data: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!firestore || !user) return;
    const colRef = collection(firestore, 'users', user.uid, 'learningLinks');
    addDoc(colRef, { ...data, userId: user.uid, createdAt: Date.now(), updatedAt: Date.now() })
      .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data })));
  };

  const updateLink = (id: string, updates: Partial<LearningLink>) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'learningLinks', id);
    updateDoc(docRef, { ...updates, updatedAt: Date.now() })
      .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: updates })));
  };

  const deleteLink = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'learningLinks', id);
    deleteDoc(docRef).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };

  const duplicateLink = (id: string) => {
    const original = links.find(l => l.id === id);
    if (!original || !firestore || !user) return;
    const { id: _, ...data } = original;
    addLink({ ...data, title: `${original.title} のコピー`, isCompleted: false });
  };

  const toggleComplete = (id: string) => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    updateLink(id, { isCompleted: !link.isCompleted });
  };

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const clearTags = () => setSelectedTags([]);
  const toggleColor = (color: LinkColor) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const clearColors = () => setSelectedColors([]);
  const toggleIcon = (icon: string) => setSelectedIcons(prev => prev.includes(icon) ? prev.filter(i => i !== icon) : [...prev, icon]);
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
      result = result.filter(l => l.title.toLowerCase().includes(s) || (l.description && l.description.toLowerCase().includes(s)) || l.tags.some(t => t.toLowerCase().includes(s)));
    }
    if (statusFilter === 'learning') result = result.filter(l => !l.isCompleted);
    if (statusFilter === 'completed') result = result.filter(l => l.isCompleted);
    if (selectedTags.length > 0) result = result.filter(l => selectedTags.some(t => l.tags.includes(t)));
    if (selectedColors.length > 0) result = result.filter(l => selectedColors.includes(l.color));
    if (selectedIcons.length > 0) result = result.filter(l => selectedIcons.includes(l.icon));
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
      {/* Admin Debug Panel (Force Visible) */}
      <div 
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999, background: '#111', color: 'white', padding: '16px', borderRadius: '16px', border: '2px solid #f87171', fontSize: '11px', minWidth: '260px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', fontFamily: 'monospace' }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f87171', borderBottom: '1px solid #333', pb: '4px' }}>ADMIN STATUS DEBUG</div>
        <div style={{ marginBottom: '4px' }}>Project: <span style={{ color: '#60a5fa' }}>{firebaseApp?.options.projectId || firebaseConfig.projectId}</span></div>
        <div style={{ marginBottom: '4px' }}>My UID: <span style={{ color: '#4ade80' }}>{user?.uid || 'Not Login'}</span></div>
        <div style={{ marginBottom: '8px' }}>Admin Found: <span style={{ color: isServerAdmin ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{String(isServerAdmin)}</span></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button 
            onClick={() => {
              if(user?.uid) {
                navigator.clipboard.writeText(user.uid);
                alert("UIDをコピーしました。Firebaseコンソールの 'admins' コレクションに、このUIDをドキュメントIDとして登録してください。");
              }
            }}
            style={{ background: '#333', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            UIDをコピー
          </button>

          <button 
            onClick={() => window.location.reload()}
            style={{ background: '#222', color: '#888', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
          >
            ページを再読み込み
          </button>
        </div>
      </div>
      
      {children}
    </LinkContext.Provider>
  );
};

export const useLinks = () => {
  const context = useContext(LinkContext);
  if (!context) throw new Error('useLinks must be used within LinkProvider');
  return context;
};

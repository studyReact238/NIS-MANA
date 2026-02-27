"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LearningLink, SortOption, StatusFilter, LinkColor } from '@/types/link';

interface LinkContextType {
  links: LearningLink[];
  isAdmin: boolean;
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
}

const LinkContext = createContext<LinkContextType | undefined>(undefined);

export const LinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [links, setLinks] = useState<LearningLink[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<LinkColor[]>([]);
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('linkflow_links');
    if (saved) {
      setLinks(JSON.parse(saved));
    } else {
      const mock: LearningLink[] = [
        {
          id: '1',
          title: 'Next.js 15 Documentation',
          url: 'https://nextjs.org/docs',
          description: 'Next.js 15 App Routerの公式ドキュメントです。最新の機能とベストプラクティスが紹介されています。',
          tags: ['Next.js', 'React', 'Frontend'],
          isCompleted: false,
          color: 'emerald',
          icon: 'book',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: 'demo-user'
        }
      ];
      setLinks(mock);
    }
    
    const savedAdmin = localStorage.getItem('linkflow_admin');
    if (savedAdmin) setIsAdmin(JSON.parse(savedAdmin));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem('linkflow_links', JSON.stringify(links));
    }
    localStorage.setItem('linkflow_admin', JSON.stringify(isAdmin));
  }, [links, isAdmin]);

  const addLink = (data: Omit<LearningLink, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newLink: LearningLink = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: 'demo-user'
    };
    setLinks([newLink, ...links]);
  };

  const updateLink = (id: string, updates: Partial<LearningLink>) => {
    setLinks(links.map(l => l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l));
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const duplicateLink = (id: string) => {
    const original = links.find(l => l.id === id);
    if (!original) return;
    const copy: LearningLink = {
      ...original,
      id: Math.random().toString(36).substr(2, 9),
      title: `${original.title} のコピー`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
    };
    setLinks([copy, ...links]);
  };

  const toggleComplete = (id: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, isCompleted: !l.isCompleted, updatedAt: Date.now() } : l));
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
        l.description?.toLowerCase().includes(s) || 
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
      links, isAdmin, setIsAdmin, search, setSearch, statusFilter, setStatusFilter, 
      sortBy, setSortBy, selectedTags, toggleTag, clearTags, selectedColors, toggleColor, 
      clearColors, selectedIcons, toggleIcon, clearIcons, addLink, updateLink, deleteLink, 
      duplicateLink, toggleComplete, filteredLinks, allTags
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

"use client";

import React, { useState } from 'react';
import { useLinks } from '@/context/LinkContext';
import { LinkCard } from '@/components/LinkCard';
import { LinkDialog } from '@/components/LinkDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  Filter, 
  Settings2, 
  LayoutGrid, 
  ArrowUpDown, 
  ShieldCheck,
  Zap,
  Tag as TagIcon,
  Palette,
  Layout
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { LinkColor, SortOption, StatusFilter } from '@/types/link';
import { LINK_COLORS, LINK_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const Dashboard: React.FC = () => {
  const { 
    filteredLinks, isAdmin, setIsAdmin, search, setSearch, statusFilter, 
    setStatusFilter, sortBy, setSortBy, selectedTags, toggleTag, 
    selectedColors, toggleColor, selectedIcons, toggleIcon, allTags
  } = useLinks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingLink(null);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12">
      {/* Header section with Stats & Admin Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-6xl font-bold">LinkFlow</h1>
            <div className="mt-2 px-4 py-1.5 bg-accent rounded-full text-accent-foreground text-sm font-bold animate-float">
              BETA
            </div>
          </div>
          <p className="text-muted-foreground text-xl">学習を加速させる、あなただけのインテリジェント・ライブラリ。</p>
        </div>

        <div className="flex items-center gap-6 glass rounded-4xl p-4 pr-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full transition-all",
              isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Admin Access</p>
              <p className="text-sm font-bold">{isAdmin ? '管理者モード' : 'ビューワー'}</p>
            </div>
          </div>
          <Switch checked={isAdmin} onCheckedChange={setIsAdmin} className="data-[state=checked]:bg-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Filters */}
        <div className="lg:col-span-3 space-y-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="検索..." 
              className="pl-12 h-14 rounded-2xl bg-white/50 border-white/30 focus:bg-white shadow-sm transition-all"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <TagIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">タグで絞り込む</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm font-medium transition-all border",
                    selectedTags.includes(tag) 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                      : "bg-white/50 border-white/30 hover:bg-white"
                  )}
                >
                  {tag}
                </button>
              ))}
              {allTags.length === 0 && <p className="text-sm text-muted-foreground italic px-2">タグが登録されていません</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">カラー</h2>
            </div>
            <div className="flex gap-3 px-1">
              {LINK_COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => toggleColor(c.name)}
                  className={cn(
                    "w-10 h-10 rounded-full border-4 transition-all",
                    c.class,
                    selectedColors.includes(c.name) ? "border-foreground scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Layout className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">タイプ</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {LINK_ICONS.map(i => {
                const IconComp = i.icon;
                return (
                  <button
                    key={i.name}
                    onClick={() => toggleIcon(i.name)}
                    className={cn(
                      "p-3 rounded-2xl transition-all border flex items-center justify-center",
                      selectedIcons.includes(i.name) 
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                        : "bg-white/50 border-white/30 hover:bg-white text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <IconComp className="w-6 h-6" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/30 p-4 rounded-4xl glass">
            <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)} className="w-full md:w-auto">
              <TabsList className="bg-transparent gap-2 p-0">
                <TabsTrigger value="all" className="rounded-2xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none">すべて</TabsTrigger>
                <TabsTrigger value="learning" className="rounded-2xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none">学習中</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-2xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none">受講済み</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                  <SelectTrigger className="border-none shadow-none bg-transparent focus:ring-0 w-[160px]">
                    <SelectValue placeholder="並べ替え" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="date-new" className="rounded-xl">更新日が新しい順</SelectItem>
                    <SelectItem value="date-old" className="rounded-xl">更新日が古い順</SelectItem>
                    <SelectItem value="title-asc" className="rounded-xl">タイトル昇順</SelectItem>
                    <SelectItem value="title-desc" className="rounded-xl">タイトル降順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <Button onClick={handleAdd} className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  <Plus className="w-5 h-5 mr-2" /> 新規追加
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {filteredLinks.map(link => (
              <LinkCard key={link.id} link={link} onEdit={handleEdit} />
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 bg-white/50 rounded-full flex items-center justify-center shadow-inner-light">
                  <LayoutGrid className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">該当するリンクがありません</h3>
                  <p className="text-muted-foreground">検索ワードやフィルター条件を変えてみてください。</p>
                </div>
                {isAdmin && (
                  <Button onClick={handleAdd} variant="outline" className="rounded-2xl h-12 px-8">
                    最初のリンクを追加する
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <LinkDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        editLink={editingLink} 
      />
    </div>
  );
};
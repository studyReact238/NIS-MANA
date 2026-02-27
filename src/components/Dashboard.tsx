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
  ArrowUpDown, 
  ShieldCheck,
  Tag as TagIcon,
  Palette,
  Layout,
  XCircle
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
    setStatusFilter, sortBy, setSortBy, selectedTags, toggleTag, clearTags,
    selectedColors, toggleColor, clearColors, selectedIcons, toggleIcon, 
    clearIcons, allTags
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
    <div className="max-w-[1600px] mx-auto px-6 py-10 md:py-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-extrabold tracking-tighter text-emerald-600">LinkFlow</h1>
            <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
              PRO
            </div>
          </div>
          <p className="text-muted-foreground text-lg">学習を加速させる、あなただけのインテリジェント・ライブラリ。</p>
        </div>

        <div className="flex items-center gap-4 bg-white/40 dark:bg-emerald-950/20 rounded-3xl p-3 pr-5 border border-emerald-100/50 backdrop-blur-sm shadow-sm">
          <div className={cn(
            "p-2 rounded-2xl transition-all shadow-sm",
            isAdmin ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Access Level</p>
            <p className="text-xs font-bold">{isAdmin ? '管理者' : '閲覧のみ'}</p>
          </div>
          <Switch checked={isAdmin} onCheckedChange={setIsAdmin} className="data-[state=checked]:bg-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Filters - More Compact */}
        <div className="lg:col-span-3 space-y-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="キーワードで検索..." 
              className="pl-11 h-12 rounded-2xl bg-white/60 border-emerald-100 focus:border-emerald-500 focus:bg-white transition-all shadow-none"
            />
          </div>

          {/* Tags Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold">タグ</h2>
              </div>
              {selectedTags.length > 0 && (
                <button onClick={clearTags} className="text-[10px] text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors">
                  <XCircle className="w-3 h-3" /> クリア
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                    selectedTags.includes(tag) 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                      : "bg-white/40 border-emerald-50/50 hover:border-emerald-200 hover:bg-white"
                  )}
                >
                  {tag}
                </button>
              ))}
              {allTags.length === 0 && <p className="text-xs text-muted-foreground italic px-1">タグなし</p>}
            </div>
          </div>

          {/* Colors Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold">カラー</h2>
              </div>
              {selectedColors.length > 0 && (
                <button onClick={clearColors} className="text-[10px] text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors">
                  <XCircle className="w-3 h-3" /> クリア
                </button>
              )}
            </div>
            <div className="flex gap-2.5 px-1">
              {LINK_COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => toggleColor(c.name)}
                  title={c.name}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all shadow-sm",
                    c.class,
                    selectedColors.includes(c.name) ? "border-emerald-600 scale-125 z-10" : "border-white/50 opacity-70 hover:opacity-100 hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold">タイプ</h2>
              </div>
              {selectedIcons.length > 0 && (
                <button onClick={clearIcons} className="text-[10px] text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors">
                  <XCircle className="w-3 h-3" /> クリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LINK_ICONS.map(i => {
                const IconComp = i.icon;
                return (
                  <button
                    key={i.name}
                    onClick={() => toggleIcon(i.name)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all border flex items-center justify-center",
                      selectedIcons.includes(i.name) 
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                        : "bg-white/40 border-emerald-50/50 hover:bg-white text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 p-3 rounded-[2rem] border border-emerald-50 backdrop-blur-sm">
            <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)} className="w-full md:w-auto">
              <TabsList className="bg-transparent gap-1 p-0">
                <TabsTrigger value="all" className="rounded-2xl px-6 h-10 data-[state=active]:bg-emerald-500 data-[state=active]:text-white shadow-none">すべて</TabsTrigger>
                <TabsTrigger value="learning" className="rounded-2xl px-6 h-10 data-[state=active]:bg-emerald-500 data-[state=active]:text-white shadow-none">学習中</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-2xl px-6 h-10 data-[state=active]:bg-emerald-500 data-[state=active]:text-white shadow-none">受講済み</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white/80 px-4 h-10 rounded-2xl border border-emerald-50">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                  <SelectTrigger className="border-none shadow-none bg-transparent focus:ring-0 w-[140px] text-xs h-auto p-0">
                    <SelectValue placeholder="並べ替え" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="date-new" className="rounded-xl text-xs">更新日が新しい順</SelectItem>
                    <SelectItem value="date-old" className="rounded-xl text-xs">更新日が古い順</SelectItem>
                    <SelectItem value="title-asc" className="rounded-xl text-xs">タイトル昇順</SelectItem>
                    <SelectItem value="title-desc" className="rounded-xl text-xs">タイトル降順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <Button onClick={handleAdd} className="rounded-2xl h-10 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-xs">
                  <Plus className="w-4 h-4 mr-1.5" /> 新規追加
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLinks.map(link => (
              <LinkCard key={link.id} link={link} onEdit={handleEdit} />
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Layout className="w-10 h-10 text-emerald-200" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">該当するリンクがありません</h3>
                  <p className="text-muted-foreground text-sm">条件をリセットして、もう一度お試しください。</p>
                </div>
                <Button variant="outline" onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  clearTags();
                  clearColors();
                  clearIcons();
                }} className="rounded-2xl h-10 px-6 border-emerald-100 text-emerald-600 hover:bg-emerald-50 text-xs">
                  すべてのフィルターをクリア
                </Button>
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

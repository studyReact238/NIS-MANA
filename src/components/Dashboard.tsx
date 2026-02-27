"use client";

import React, { useState, useCallback } from 'react';
import { useLinks } from '@/context/LinkContext';
import { LinkCard } from '@/components/LinkCard';
import { LinkDialog } from '@/components/LinkDialog';
import { PasswordChangeDialog } from '@/components/PasswordChangeDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Tag as TagIcon,
  Palette,
  Layout,
  XCircle,
  User,
  LogOut,
  Loader2,
  Lock
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { StatusFilter, SortOption, LearningLink } from '@/types/link';
import { LINK_COLORS, LINK_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const Dashboard: React.FC = () => {
  const { 
    filteredLinks, isAdmin, isServerAdmin, setIsAdmin, search, setSearch, statusFilter, 
    setStatusFilter, sortBy, setSortBy, selectedTags, toggleTag, clearTags,
    selectedColors, toggleColor, clearColors, selectedIcons, toggleIcon, 
    clearIcons, allTags, isLoading
  } = useLinks();

  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LearningLink | null>(null);

  const handleEdit = useCallback((link: LearningLink) => {
    setEditingLink(link);
    setDialogOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingLink(null);
    setDialogOpen(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "ログアウトしました", description: "またのご利用をお待ちしております。" });
    } catch (error) {
      toast({ variant: "destructive", title: "エラー", description: "ログアウトに失敗しました。" });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-20">
      {/* Fixed Header Section */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 -mx-6 px-6 mb-4 border-b border-emerald-100">
        <div className="flex items-center justify-between bg-emerald-100/30 p-5 rounded-3xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md">L</div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-800">LinkFlow</h1>
          </div>

          <div className="flex items-center gap-6">
            {isAdmin && (
              <Button 
                onClick={handleAdd} 
                className="rounded-full h-10 px-6 bg-emerald-700 hover:bg-emerald-800 shadow-md font-bold text-sm border-2 border-emerald-800 transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" /> 新規追加
              </Button>
            )}

            {/* 管理者のみ編集モードの切り替えを表示 */}
            {isServerAdmin && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-emerald-200 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-tight">編集モード</span>
                <Switch 
                  checked={isAdmin} 
                  onCheckedChange={setIsAdmin} 
                  className="data-[state=checked]:bg-emerald-600" 
                />
              </div>
            )}

            <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none text-emerald-950 truncate max-w-[150px]">{user?.email}</p>
                <p className="text-[9px] text-emerald-600 font-bold tracking-wider uppercase">{isServerAdmin ? 'Administrator' : 'Learner'}</p>
              </div>
              
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] shadow-2xl border-2 border-emerald-100">
                  <DropdownMenuItem 
                    onSelect={() => setPasswordDialogOpen(true)}
                    className="rounded-xl cursor-pointer text-xs h-11 font-bold text-emerald-900 focus:bg-emerald-50"
                  >
                    <Lock className="w-4 h-4 mr-2 text-emerald-600" /> パスワード変更
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-emerald-100" />
                  <DropdownMenuItem 
                    onSelect={handleLogout} 
                    className="rounded-xl cursor-pointer text-rose-600 text-xs h-11 font-bold focus:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter Panel */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/10 border border-emerald-200 p-8 mb-10 space-y-4">
        <div className="relative group max-w-3xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="タイトルや説明、タグで検索..." 
            className="pl-14 h-16 rounded-full bg-emerald-50/50 border-emerald-100 border-2 focus:border-emerald-500 focus:ring-0 text-lg transition-all"
          />
        </div>

        <div className="flex justify-center pb-2">
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)} className="w-full max-w-xl">
            <TabsList className="grid grid-cols-3 h-12 bg-emerald-100/50 rounded-2xl p-1 gap-1 border border-emerald-200">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-xs">すべて</TabsTrigger>
              <TabsTrigger value="learning" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> 学習中
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" /> 受講済み
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4 pt-4 border-t border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-800 min-w-[70px]">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold whitespace-nowrap">並べ替え:</span>
              </div>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="w-full max-w-[180px] border-emerald-200 bg-emerald-50/50 rounded-xl h-8 text-[10px] font-bold text-emerald-900">
                  <SelectValue placeholder="並べ替え" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-emerald-200">
                  <SelectItem value="date-new">更新日時：新着順</SelectItem>
                  <SelectItem value="date-old">更新日時：古い順</SelectItem>
                  <SelectItem value="title-asc">タイトル：昇順</SelectItem>
                  <SelectItem value="title-desc">タイトル：降順</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-800 min-w-[70px]">
                <Palette className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold whitespace-nowrap">カラー:</span>
              </div>
              <div className="flex items-center gap-2">
                {LINK_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all",
                      c.class,
                      selectedColors.includes(c.name) ? "border-emerald-800 scale-110 ring-2 ring-emerald-200" : "border-white shadow-sm hover:scale-105"
                    )}
                  />
                ))}
                {selectedColors.length > 0 && (
                  <button onClick={clearColors} className="px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" /> クリア
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 min-w-[70px]">
              <Layout className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold whitespace-nowrap">タイプ:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {LINK_ICONS.map(i => {
                const IconComp = i.icon;
                return (
                  <button
                    key={i.name}
                    onClick={() => toggleIcon(i.name)}
                    className={cn(
                      "p-1.5 rounded-lg transition-all border",
                      selectedIcons.includes(i.name) 
                        ? "bg-emerald-600 text-white border-emerald-700" 
                        : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </button>
                );
              })}
              {selectedIcons.length > 0 && (
                <button onClick={clearIcons} className="px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-2.5 h-2.5" /> クリア
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 min-w-[70px] pt-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold whitespace-nowrap">タグ:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-0.5 rounded-full text-[9px] font-bold border transition-all",
                    selectedTags.includes(tag) 
                      ? "bg-emerald-700 text-white border-emerald-800" 
                      : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                  )}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button onClick={clearTags} className="px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-2.5 h-2.5" /> クリア
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-emerald-800 font-bold">データを取得中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLinks.map(link => (
            <LinkCard key={link.id} link={link} onEdit={handleEdit} />
          ))}
          
          {filteredLinks.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-4xl border-4 border-dashed border-emerald-100/50">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100/50">
                <Search className="w-10 h-10 text-emerald-200" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">該当するリンクが見つかりません</h3>
            </div>
          )}
        </div>
      )}

      <LinkDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setTimeout(() => setEditingLink(null), 300);
          }
        }} 
        editLink={editingLink} 
      />

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
};
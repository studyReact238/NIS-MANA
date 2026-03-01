
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useLinks } from '@/context/LinkContext';
import { LinkCard } from '@/components/LinkCard';
import { LinkDialog } from '@/components/LinkDialog';
import { PasswordChangeDialog } from '@/components/PasswordChangeDialog';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { Timeline } from '@/components/Timeline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Lock,
  Users,
  CheckCircle2,
  Target
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
    links, filteredLinks, isAdmin, isServerAdmin, setIsAdmin, search, setSearch, statusFilter, 
    setStatusFilter, sortBy, setSortBy, selectedTags, toggleTag, clearTags,
    selectedColors, toggleColor, clearColors, selectedIcons, toggleIcon, 
    clearIcons, allTags, isLoading
  } = useLinks();

  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
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
      if (auth) {
        await signOut(auth);
        toast({ title: "ログアウトしました", description: "またのご利用をお待ちしております。" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "エラー", description: "ログアウトに失敗しました。" });
    }
  };

  // 進捗計算
  const progressStats = useMemo(() => {
    const total = links.length;
    const completed = links.filter(l => l.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [links]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 sm:py-6 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4 border-b border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-emerald-100/30 p-4 sm:p-5 rounded-3xl border border-emerald-200 shadow-sm gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shrink-0">に</div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-800 whitespace-nowrap">にすまな</h1>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-2xl border-2 border-emerald-100">
                  <div className="px-3 py-2 border-b border-emerald-50 mb-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{isServerAdmin ? 'Administrator' : 'Learner'}</p>
                    <p className="text-xs font-bold text-emerald-950 truncate">{user?.email}</p>
                  </div>
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end w-full md:w-auto">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setUserManagementOpen(true)}
                  variant="outline"
                  className="rounded-full h-9 sm:h-10 px-3 sm:px-4 border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 text-xs"
                >
                  <Users className="w-3.5 h-3.5 sm:mr-2" /> 
                  <span className="hidden sm:inline">ユーザー管理</span>
                </Button>
                <Button 
                  onClick={handleAdd} 
                  className="rounded-full h-9 sm:h-10 px-4 sm:px-6 bg-emerald-700 hover:bg-emerald-800 shadow-md font-bold text-xs border-2 border-emerald-800 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 sm:mr-2" /> 
                  <span className="hidden sm:inline">新規追加</span>
                  <span className="sm:hidden">追加</span>
                </Button>
              </div>
            )}

            {isServerAdmin && (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-200 shadow-sm">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-900 uppercase tracking-tight">編集</span>
                <Switch 
                  checked={isAdmin} 
                  onCheckedChange={setIsAdmin} 
                  className="scale-90 sm:scale-100 data-[state=checked]:bg-emerald-600" 
                />
              </div>
            )}

            <div className="hidden md:flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-bold leading-none text-emerald-950 truncate max-w-[120px] mb-1">{user?.email}</p>
                <p className="text-[9px] text-emerald-600 font-bold tracking-wider uppercase">{isServerAdmin ? 'Admin' : 'Learner'}</p>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-emerald-100 p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">学習進捗</p>
              <p className="text-lg font-black text-emerald-950">{progressStats.percentage}% <span className="text-xs text-slate-400">完了</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-emerald-800">
              {progressStats.completed} / {progressStats.total}
            </p>
            <p className="text-[9px] text-slate-400 font-bold">受講済み / 全体</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-emerald-100 p-4 sm:p-5 shadow-sm hidden sm:flex items-center gap-4">
          <div className="flex-1 space-y-2">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">プログレスバー</span>
                <span className="text-[10px] font-black text-emerald-700">{progressStats.percentage}%</span>
             </div>
             <Progress value={progressStats.percentage} className="h-2 bg-emerald-50" />
          </div>
        </div>
      </div>

      {/* Main Filter Panel */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-emerald-900/10 border border-emerald-200 p-5 sm:p-8 mb-6 sm:mb-8 space-y-4">
        <div className="relative group max-w-3xl mx-auto">
          <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:h-5 sm:w-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="タイトルやタグで検索..." 
            className="pl-12 sm:pl-14 h-14 sm:h-16 rounded-full bg-emerald-50/50 border-emerald-100 border-2 focus:border-emerald-500 focus:ring-0 text-base sm:text-lg transition-all"
          />
        </div>

        <div className="flex justify-center pb-2">
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)} className="w-full max-w-xl">
            <TabsList className="grid grid-cols-3 h-10 sm:h-12 bg-emerald-100/50 rounded-2xl p-1 gap-1 border border-emerald-200">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-[10px] sm:text-xs px-1">すべて</TabsTrigger>
              <TabsTrigger value="learning" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-[10px] sm:text-xs px-1">学習中</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-800 font-bold text-[10px] sm:text-xs px-1">受講済み</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4 pt-4 border-t border-emerald-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-emerald-800 min-w-[60px] sm:min-w-[70px]">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">並べ替え:</span>
              </div>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="w-full max-w-[220px] border-emerald-200 bg-emerald-50/50 rounded-xl h-8 text-[10px] font-bold text-emerald-900">
                  <SelectValue placeholder="並べ替え" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-emerald-200">
                  <SelectItem value="date-new">更新日時：新着順</SelectItem>
                  <SelectItem value="date-old">更新日時：古い順</SelectItem>
                  <SelectItem value="title-asc">タイトル：昇順</SelectItem>
                  <SelectItem value="title-desc">タイトル：降順</SelectItem>
                  <SelectItem value="rating-high">評価：高い順</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-emerald-800 min-w-[60px] sm:min-w-[70px]">
                <Palette className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">カラー:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {LINK_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all shrink-0",
                      c.class,
                      selectedColors.includes(c.name) ? "border-emerald-800 scale-110 ring-4 ring-emerald-200" : "border-white shadow-md hover:scale-105"
                    )}
                  />
                ))}
                {selectedColors.length > 0 && (
                  <button onClick={clearColors} className="px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase">
                    クリア
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 min-w-[60px] sm:min-w-[70px]">
              <Layout className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">タイプ:</span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2">
              {LINK_ICONS.map(i => {
                const IconComp = i.icon;
                return (
                  <button
                    key={i.name}
                    onClick={() => toggleIcon(i.name)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-xl transition-all border-2",
                      selectedIcons.includes(i.name) 
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-105" 
                        : "bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
              {selectedIcons.length > 0 && (
                <button onClick={clearIcons} className="col-span-4 sm:col-span-1 px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase text-center mt-1 sm:mt-0">
                  すべてクリア
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 min-w-[60px] sm:min-w-[70px] pt-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">タグ:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold border-2 transition-all",
                    selectedTags.includes(tag) 
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" 
                      : "bg-emerald-50/50 text-emerald-900 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200"
                  )}
                >
                  #{tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button onClick={clearTags} className="px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase">
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Count and Actions */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black px-3 py-1 rounded-full text-[10px]">
            {filteredLinks.length} <span className="ml-1 opacity-60">件のリンク</span>
          </Badge>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">検索結果を表示中</span>
        </div>
        {(search || selectedTags.length > 0 || selectedColors.length > 0 || selectedIcons.length > 0 || statusFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearch('');
              clearTags();
              clearColors();
              clearIcons();
              setStatusFilter('all');
            }}
            className="text-[10px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-7"
          >
            <XCircle className="w-3 h-3 mr-1" /> 条件をクリア
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-emerald-800 font-bold">データを取得中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredLinks.map(link => (
              <LinkCard key={link.id} link={link} onEdit={handleEdit} />
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="col-span-full py-20 sm:py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2rem] border-4 border-dashed border-emerald-100/50 px-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100/50">
                  <Search className="w-8 h-8 text-emerald-200" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-emerald-900">該当するリンクが見つかりません</h3>
                <p className="text-sm text-slate-400 font-medium">条件を変えて試してみてください。</p>
              </div>
            )}
          </div>

          <Timeline />
        </>
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
        onOpenChange={passwordDialogOpen}
      />

      {isAdmin && (
        <UserManagementDialog
          open={userManagementOpen}
          onOpenChange={setUserManagementOpen}
        />
      )}
    </div>
  );
};

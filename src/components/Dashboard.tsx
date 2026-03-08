
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useLinks } from '@/context/LinkContext';
import { LinkCard } from '@/components/LinkCard';
import { LinkDialog } from '@/components/LinkDialog';
import { ProfileSettingsDialog } from '@/components/ProfileSettingsDialog';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { Timeline } from '@/components/Timeline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Tag as TagIcon,
  Palette,
  Layout,
  LogOut,
  Users,
  Target,
  Zap,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatusFilter, SortOption, LearningLink, RecommendationFilter } from '@/types/link';
import { LINK_COLORS, LINK_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const Dashboard: React.FC = () => {
  const { 
    links, filteredLinks, isAdmin, isServerAdmin, setIsAdmin, search, setSearch, statusFilter, 
    setStatusFilter, recommendationFilter, setRecommendationFilter, sortBy, setSortBy, 
    selectedTags, toggleTag, clearTags, selectedColors, toggleColor, clearColors, 
    selectedIcons, toggleIcon, clearIcons, allTags, isLoading
  } = useLinks();

  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LearningLink | null>(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData } = useDoc<any>(userDocRef);

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
        if (user) {
          sessionStorage.removeItem(`nisumana_logged_v11_${user.uid}`);
        }
        await signOut(auth);
        toast({ title: "ログアウトしました", description: "またのご利用をお待ちしております。" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "エラー", description: "ログアウトに失敗しました。" });
    }
  };

  const progressStats = useMemo(() => {
    const total = links.length;
    if (total === 0) return { 
      total: 0, 
      completed: 0, completedP: 0,
      learning: 0, learningP: 0,
      unstarted: 0, unstartedP: 0
    };

    const completed = links.filter(l => l.status === 'completed').length;
    const learning = links.filter(l => l.status === 'learning').length;
    const unstarted = links.filter(l => l.status === 'unstarted').length;

    return { 
      total, 
      completed, completedP: Math.round((completed / total) * 100),
      learning, learningP: Math.round((learning / total) * 100),
      unstarted, unstartedP: Math.round((unstarted / total) * 100)
    };
  }, [links]);

  const testLinks = useMemo(() => {
    return links.filter(l => l.status === 'completed');
  }, [links]);

  const filteredTestLinks = useMemo(() => {
    let result = [...testLinks];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        l.title?.toLowerCase().includes(s) || 
        (l.description && l.description.toLowerCase().includes(s)) || 
        (l.tags || []).some(t => t.toLowerCase().includes(s))
      );
    }
    if (selectedTags.length > 0) result = result.filter(l => selectedTags.some(t => (l.tags || []).includes(t)));
    if (selectedColors.length > 0) result = result.filter(l => selectedColors.includes(l.color));
    if (selectedIcons.length > 0) result = result.filter(l => selectedIcons.includes(l.icon));
    
    return result;
  }, [testLinks, search, selectedTags, selectedColors, selectedIcons]);

  const displayName = `${userData?.lastName || ''} ${userData?.firstName || ''}`.trim() || user?.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 1).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 sm:py-6 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4 border-b border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-emerald-100/30 p-4 sm:p-5 rounded-3xl border border-emerald-200 shadow-sm gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-black shrink-0 shadow-md">
                に
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-800 whitespace-nowrap">にすまな</h1>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border-2 border-emerald-200 p-0 overflow-hidden bg-white shadow-sm">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={userData?.photoURL} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-2xl border-2 border-emerald-100">
                  <div className="px-3 py-3 border-b border-emerald-50 mb-1 flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-emerald-100">
                      <AvatarImage src={userData?.photoURL} />
                      <AvatarFallback className="bg-emerald-50 text-emerald-600 text-[10px] font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{isServerAdmin ? '管理者' : '学習者'}</p>
                      <p className="text-xs font-bold text-emerald-950 truncate">{displayName}</p>
                    </div>
                  </div>
                  <DropdownMenuItem 
                    onSelect={() => setProfileSettingsOpen(true)}
                    className="rounded-xl cursor-pointer text-xs h-11 font-bold text-emerald-900 focus:bg-emerald-50"
                  >
                    <Settings className="w-4 h-4 mr-2 text-emerald-600" /> プロフィール設定
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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <Button 
                    onClick={() => setUserManagementOpen(true)}
                    variant="outline"
                    className="rounded-full h-9 sm:h-10 px-3 sm:px-4 border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 text-xs"
                  >
                    <span>ユーザー管理</span>
                    <Users className="w-3.5 h-3.5 ml-2" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>ユーザーの登録や権限、システムのメンテナンスを行います。</p>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Button 
                  onClick={handleAdd} 
                  className="rounded-full h-9 sm:h-10 px-4 sm:px-6 bg-emerald-700 hover:bg-emerald-800 shadow-md font-bold text-xs border-2 border-emerald-800 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" /> 
                  <span>新規追加</span>
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>新しい学習用リンク（教材）を登録します。</p>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isServerAdmin && (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-200 shadow-sm">
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-900 uppercase tracking-tight">編集モード</span>
                <Switch 
                  checked={isAdmin} 
                  onCheckedChange={setIsAdmin} 
                  className="scale-90 sm:scale-100 data-[state=checked]:bg-emerald-600" 
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>オンにすると、各教材の編集や削除が行えるようになります。</p>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="hidden md:flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-bold leading-none text-emerald-950 truncate max-w-[120px] mb-1">{displayName}</p>
                <p className="text-[9px] text-emerald-600 font-bold tracking-wider uppercase">{isServerAdmin ? 'Admin' : 'Learner'}</p>
              </div>
              
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border-2 border-emerald-100 p-0 overflow-hidden bg-emerald-50 hover:bg-emerald-100 shadow-sm transition-all">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={userData?.photoURL} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] shadow-2xl border-2 border-emerald-100">
                  <DropdownMenuItem 
                    onSelect={() => setProfileSettingsOpen(true)}
                    className="rounded-xl cursor-pointer text-xs h-11 font-bold text-emerald-900 focus:bg-emerald-50"
                  >
                    <Settings className="w-4 h-4 mr-2 text-emerald-600" /> プロフィール設定
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

      <div className="bg-white rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest">現在の学習進捗</h2>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-xs text-xs">
                <p>全教材に対するあなたの現在の進捗状況をリアルタイムで表示しています。</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">受講済み: <span className="text-emerald-700">{progressStats.completed}</span> ({progressStats.completedP}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-slate-600">学習中: <span className="text-blue-700">{progressStats.learning}</span> ({progressStats.learningP}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-600">未着手: <span className="text-slate-700">{progressStats.unstarted}</span> ({progressStats.unstartedP}%)</span>
            </div>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${progressStats.completedP}%` }} 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out relative group"
          />
          <div 
            style={{ width: `${progressStats.learningP}%` }} 
            className="bg-blue-500 h-full transition-all duration-500 ease-out relative group border-l border-white/20"
          />
          <div 
            style={{ width: `${progressStats.unstartedP}%` }} 
            className="bg-slate-300 h-full transition-all duration-500 ease-out relative group border-l border-white/20"
          />
        </div>
        <p className="text-[10px] text-slate-400 font-bold italic text-right">※全リンク数に対する自身の進捗割合</p>
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-emerald-100/50 p-1 rounded-2xl border border-emerald-200 h-12">
            <TabsTrigger value="links" className="rounded-xl px-6 sm:px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800 text-xs sm:text-sm">
              <Layout className="w-4 h-4 mr-2" /> リンク集
            </TabsTrigger>
            <TabsTrigger value="tests" className="rounded-xl px-6 sm:px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800 text-xs sm:text-sm">
              <ClipboardCheck className="w-4 h-4 mr-2" /> 確認テスト
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl px-6 sm:px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800 text-xs sm:text-sm">
              <Zap className="w-4 h-4 mr-2" /> タイムライン
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="links" className="space-y-6">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-emerald-900/10 border border-emerald-200 p-5 sm:p-8 space-y-4">
            <div className="space-y-2 max-w-3xl mx-auto">
              <div className="flex items-center gap-2 pl-2">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">検索キーワード</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>教材のタイトル、説明、設定されたタグから部分一致で検索できます。</p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative group">
                <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:h-5 sm:w-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="キーワードで検索..." 
                  className="pl-12 sm:pl-14 h-14 sm:h-16 rounded-full bg-emerald-50/50 border-emerald-100 border-2 focus:border-emerald-500 focus:ring-0 text-base sm:text-lg transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pb-2">
              <div className="flex flex-col gap-1.5 flex-1 max-w-md">
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">自分の受講状況で絞り込む</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>未着手や学習中など、現在の学習ステータスで表示を絞り込みます。</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)} className="w-full">
                  <TabsList className="grid grid-cols-4 h-10 sm:h-12 bg-emerald-100/50 rounded-2xl p-1 gap-1 border border-emerald-200">
                    <TabsTrigger value="all" className="rounded-xl font-bold text-[10px] sm:text-xs">すべて</TabsTrigger>
                    <TabsTrigger value="unstarted" className="rounded-xl font-bold text-[10px] sm:text-xs text-slate-600">未着手</TabsTrigger>
                    <TabsTrigger value="learning" className="rounded-xl font-bold text-[10px] sm:text-xs text-blue-700">学習中</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl font-bold text-[10px] sm:text-xs text-emerald-700">受講済み</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 max-w-md">
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">評価状況で絞り込む</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>多くのユーザーから評価された「推奨コンテンツ」のみを表示できます。</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Tabs value={recommendationFilter} onValueChange={(val) => setRecommendationFilter(val as RecommendationFilter)} className="w-full">
                  <TabsList className="grid grid-cols-3 h-10 sm:h-12 bg-emerald-100/50 rounded-2xl p-1 gap-1 border border-emerald-200">
                    <TabsTrigger value="all" className="rounded-xl font-bold text-[10px] sm:text-xs">すべて</TabsTrigger>
                    <TabsTrigger value="recommended" className="rounded-xl font-bold text-[10px] sm:text-xs text-emerald-700 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> 推奨
                    </TabsTrigger>
                    <TabsTrigger value="not-recommended" className="rounded-xl font-bold text-[10px] sm:text-xs text-slate-500 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 非推奨
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-emerald-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-800 min-w-[80px] sm:min-w-[90px]">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">並べ替え:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs text-xs">
                        <p>表示する順番を変更します。評価順や学習中人数順がおすすめです。</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                    <SelectTrigger className="w-full max-w-[220px] border-emerald-200 bg-emerald-50/50 rounded-xl h-8 text-[10px] font-bold text-emerald-900">
                      <SelectValue placeholder="表示順を選択" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-emerald-200">
                      <SelectItem value="date-new">更新日時：新着順</SelectItem>
                      <SelectItem value="date-old">更新日時：古い順</SelectItem>
                      <SelectItem value="title-asc">タイトル：昇順</SelectItem>
                      <SelectItem value="title-desc">タイトル：降順</SelectItem>
                      <SelectItem value="rating-high">評価：高い順</SelectItem>
                      <SelectItem value="learning-high">学習中人数：多い順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-800 min-w-[80px] sm:min-w-[90px]">
                    <Palette className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">カラー:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs text-xs">
                        <p>教材に設定されたテーマカラーで絞り込みます。</p>
                      </PopoverContent>
                    </Popover>
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
                        aria-label={`${c.name}色で絞り込む`}
                      />
                    ))}
                    {selectedColors.length > 0 && (
                      <button onClick={clearColors} className="px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase">
                        リセット
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-emerald-800 min-w-[80px] sm:min-w-[90px]">
                  <Layout className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">タイプ:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>教材に設定されたアイコンの種類（動画、本、Webなど）で絞り込みます。</p>
                    </PopoverContent>
                  </Popover>
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
                        aria-label={`${i.name}タイプで絞り込む`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                  {selectedIcons.length > 0 && (
                    <button onClick={clearIcons} className="col-span-4 sm:col-span-1 px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase text-center mt-1 sm:mt-0">
                      リセット
                    </button>
                  )}
                </div>
              </div>

              <Collapsible open={tagsExpanded} onOpenChange={setTagsExpanded} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 min-w-[80px] sm:min-w-[90px]">
                    <TagIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">タグ絞り込み:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs text-xs">
                        <p>特定のキーワード（タグ）が含まれる教材を抽出します。複数選択可能です。</p>
                      </PopoverContent>
                    </Popover>
                    {selectedTags.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-2 bg-emerald-600 text-white text-[9px] font-black">
                        {selectedTags.length}
                      </Badge>
                    )}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-600 font-bold text-[10px] rounded-lg">
                      {tagsExpanded ? <><ChevronUp className="w-3 h-3 mr-1" /> 閉じる</> : <><ChevronDown className="w-3 h-3 mr-1" /> タグ一覧を表示</>}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="space-y-2 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="flex flex-wrap gap-1.5 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold border-2 transition-all",
                          selectedTags.includes(tag) 
                            ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" 
                            : "bg-white text-emerald-900 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                    {allTags.length === 0 && <span className="text-xs text-slate-400 italic">タグがまだありません</span>}
                    {selectedTags.length > 0 && (
                      <button onClick={clearTags} className="px-2 py-1 rounded-full text-[9px] font-black text-rose-600 bg-rose-50 border-2 border-rose-100 uppercase">
                        リセット
                      </button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2 mt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black px-3 py-1 rounded-full text-[10px]">
                {filteredLinks.length} <span className="ml-1 opacity-60">件表示中</span>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredLinks.map(link => (
              <LinkCard key={link.id} link={link} onEdit={handleEdit} />
            ))}
            {filteredLinks.length === 0 && !isLoading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2rem] border-4 border-dashed border-emerald-100/50 px-6">
                <h3 className="text-lg font-bold text-emerald-900">該当するリンクが見つかりません</h3>
                <p className="text-sm text-slate-400 font-medium">条件を変えて検索してみてください。</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-blue-900/10 border border-blue-200 p-5 sm:p-8 space-y-4 text-center">
             <div className="mb-4">
                <h2 className="text-xl font-bold text-blue-900 flex items-center justify-center gap-2">
                   <ClipboardCheck className="w-6 h-6" /> 受講済みテスト一覧
                </h2>
                <p className="text-sm text-blue-600 font-medium mt-1">「受講済み」ステータスになった教材のテストをいつでも受けられます。</p>
             </div>
             <div className="relative group max-w-3xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 text-blue-400" />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="受講済みの中からタイトルで検索..." 
                className="pl-12 h-14 rounded-full bg-blue-50/50 border-blue-100 border-2 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTestLinks.map(link => (
              <LinkCard key={link.id} link={link} onEdit={handleEdit} isTestView />
            ))}
            {filteredTestLinks.length === 0 && !isLoading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2rem] border-4 border-dashed border-blue-100/50 px-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-blue-200" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">表示できるテストがありません</h3>
                <p className="text-sm text-slate-400">リンクを学習して「受講済み」にするとここに表示されます。</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline />
        </TabsContent>
      </Tabs>

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

      <ProfileSettingsDialog
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
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

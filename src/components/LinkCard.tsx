
"use client";

import React, { useState, useEffect } from 'react';
import { LearningLink, LinkStatus } from '@/types/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getIcon, 
  getColorData 
} from '@/lib/constants';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit3, 
  ExternalLink,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Users,
  Calendar,
  BookOpen,
  Circle,
  ClipboardCheck,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useLinks } from '@/context/LinkContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, updateDoc, increment, deleteDoc, collection } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

interface LinkCardProps {
  link: LearningLink;
  onEdit: (link: LearningLink) => void;
  isTestView?: boolean;
}

const SPARKLE_COLORS = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#ffffff', '#a855f7', '#ec4899'];

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, isTestView }) => {
  const { isAdmin, isServerAdmin, updateStatus, deleteLink, duplicateLink, toggleTag, selectedTags } = useLinks();
  const { user } = useUser();
  const firestore = useFirestore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  
  useEffect(() => {
    if (showSparkles) {
      const newSparkles = [...Array(24)].map((_, i) => {
        const angle = (i * 15) * (Math.PI / 180);
        const distance = 50 + Math.random() * 80;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
          delay: Math.random() * 0.1
        };
      });
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [showSparkles]);

  const voteDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !link.id) return null;
    return doc(firestore, 'learningLinks', link.id, 'votes', user.uid);
  }, [firestore, user?.uid, link.id]);
  
  const { data: voteData } = useDoc<any>(voteDocRef);
  const userVote = voteData?.type as 'up' | 'down' | undefined;

  const creatorDocRef = useMemoFirebase(() => {
    if (!firestore || !link.createdBy) return null;
    return doc(firestore, 'users', link.createdBy);
  }, [firestore, link.createdBy]);

  const { data: creatorData } = useDoc<any>(creatorDocRef);

  const completionsRef = useMemoFirebase(() => {
    if (!firestore || !isServerAdmin || !link.id || !detailOpen) return null;
    return collection(firestore, 'learningLinks', link.id, 'completions');
  }, [firestore, isServerAdmin, link.id, detailOpen]);

  const { data: completions, isLoading: isCompletionsLoading } = useCollection<any>(completionsRef);

  const learnersRef = useMemoFirebase(() => {
    if (!firestore || !isServerAdmin || !link.id || !detailOpen) return null;
    return collection(firestore, 'learningLinks', link.id, 'learners');
  }, [firestore, isServerAdmin, link.id, detailOpen]);

  const { data: learners, isLoading: isLearnersLoading } = useCollection<any>(learnersRef);

  const Icon = getIcon(link.icon);
  const colorData = getColorData(link.color);

  // 編集・削除権限の判定: 管理者モードがONか、自分が作成者の場合に許可
  const canManage = isAdmin || (user && user.uid === link.createdBy);

  const handleStatusChange = (newStatus: LinkStatus) => {
    if (newStatus === 'completed' && link.status !== 'completed') {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }
    updateStatus(link.id, newStatus);
  };

  const handleVote = (type: 'up' | 'down') => {
    if (!firestore || !user) return;
    const voteRef = doc(firestore, 'learningLinks', link.id, 'votes', user.uid);
    const linkRef = doc(firestore, 'learningLinks', link.id);

    if (userVote === type) {
      deleteDoc(voteRef).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: voteRef.path, operation: 'delete' })));
      
      const currentVoteCount = (link as any)[`${type}voteCount`] || 0;
      if (currentVoteCount > 0) {
        updateDoc(linkRef, {
          [`${type}voteCount`]: increment(-1)
        }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: linkRef.path, operation: 'update' })));
      }
    } else {
      const oldVote = userVote;
      setDoc(voteRef, { type, updatedAt: Date.now() }, { merge: true })
        .catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: voteRef.path, operation: 'write', requestResourceData: { type } })));
      
      const updates: any = {
        [`${type}voteCount`]: increment(1)
      };
      if (oldVote) {
        const oldVoteCount = (link as any)[`${oldVote}voteCount`] || 0;
        if (oldVoteCount > 0) {
          updates[`${oldVote}voteCount`] = increment(-1);
        }
      }
      updateDoc(linkRef, updates).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: linkRef.path, operation: 'update' })));
    }
  };

  const getStatusLabel = (status: LinkStatus) => {
    switch (status) {
      case 'unstarted': return '未着手';
      case 'learning': return '学習中';
      case 'completed': return '受講済み';
    }
  };

  const getStatusIcon = (status: LinkStatus) => {
    switch (status) {
      case 'unstarted': return <Circle className="w-4 h-4" />;
      case 'learning': return <BookOpen className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  // メールアドレスから名前を抽出して「さん」を付ける
  const formatDisplayName = (email?: string) => {
    if (!email) return '不明さん';
    return `${email.split('@')[0]}さん`;
  };

  const hasTest = !!(link.testUrl || link.testHtml);
  const testHref = link.testHtml ? `/test-viewer?id=${link.id}` : (link.testUrl || '#');

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 shadow-sm",
        cn(colorData.bg, colorData.border)
      )}>
        {link.status === 'completed' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
            <CheckCircle2 className="w-64 h-64 text-emerald-600/50" />
          </div>
        )}

        <CardContent className="p-8 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-black/5 bg-white"
            )}>
              <Icon className={cn("w-7 h-7", colorData.text)} />
            </div>
            
            <div className="flex items-center gap-3 relative">
              {showSparkles && sparkles.length > 0 && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    {sparkles.map((s) => (
                      <div 
                        key={s.id} 
                        className="absolute w-2 h-2 rounded-full animate-float-up"
                        style={{ 
                          backgroundColor: s.color,
                          top: '50%', 
                          left: '50%', 
                          margin: '-4px',
                          '--tw-translate-x': `${s.x}px`,
                          '--tw-translate-y': `${s.y}px`,
                          animationDelay: `${s.delay}s`,
                        } as any}
                      />
                    ))}
                  </div>
                </div>
              )}

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 h-auto rounded-full border-2 transition-all",
                      link.status === 'completed' ? "bg-emerald-600 border-emerald-700 text-white" :
                      link.status === 'learning' ? "bg-blue-600 border-blue-700 text-white" :
                      "bg-white border-slate-200 text-slate-700"
                    )}
                  >
                    {getStatusIcon(link.status)}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {getStatusLabel(link.status)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl p-2 min-w-[140px] shadow-2xl border-2 border-emerald-100">
                  <DropdownMenuItem onClick={() => handleStatusChange('unstarted')} className="rounded-xl font-bold text-xs h-10">
                    <Circle className="w-4 h-4 mr-2" /> 未着手
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('learning')} className="rounded-xl font-bold text-xs h-10 text-blue-600">
                    <BookOpen className="w-4 h-4 mr-2" /> 学習中
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')} className="rounded-xl font-bold text-xs h-10 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> 受講済み
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* 管理者モード、または自分が作成者の場合にメニューを表示 */}
              {canManage && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/50 border border-black/5">
                      <MoreVertical className="w-5 h-5 text-slate-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl border-2 border-emerald-100">
                    <DropdownMenuItem 
                      onSelect={() => onEdit(link)} 
                      className="rounded-xl cursor-pointer text-xs h-11 font-bold text-emerald-900 focus:bg-emerald-50"
                    >
                      <Edit3 className="w-4 h-4 mr-2 text-emerald-600" /> 編集
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={() => duplicateLink(link.id)} 
                      className="rounded-xl cursor-pointer text-xs h-11 font-bold text-emerald-900 focus:bg-emerald-50"
                    >
                      <Copy className="w-4 h-4 mr-2 text-blue-600" /> 複製
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={() => setDeleteDialogOpen(true)} 
                      className="rounded-xl cursor-pointer text-rose-600 text-xs h-11 font-bold focus:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> 削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setDetailOpen(true)}
              className={cn(
                "text-xl font-bold leading-snug line-clamp-2 transition-colors text-left hover:opacity-80",
                colorData.darkText
              )}
            >
              {link.title}
            </button>
            
            <ScrollArea className="h-24 pr-4 -mr-4">
              <p className={cn(
                "text-sm font-medium leading-relaxed text-slate-700"
              )}>
                {link.description || '概要の記載はありません。'}
              </p>
            </ScrollArea>

            <div className="flex flex-wrap gap-2 pt-2">
              {link.tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(tag);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black border-2 cursor-pointer transition-all",
                    selectedTags.includes(tag) 
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-md" 
                      : cn(colorData.badge, "hover:bg-opacity-80")
                  )}
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-4 mt-2 border-t-2 border-black/5">
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{Math.max(0, link.completedCount || 0)}人が受講完了</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-blue-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{Math.max(0, link.learningCount || 0)}人が学習中</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 ml-auto">
                 <button 
                   onClick={() => handleVote('up')}
                   className={cn(
                     "flex items-center gap-1.5 transition-all hover:scale-110",
                     userVote === 'up' ? "text-emerald-600 scale-110" : "text-slate-400"
                   )}
                 >
                   <ThumbsUp className={cn("w-4 h-4", userVote === 'up' && "fill-emerald-600")} />
                   <span className="text-[10px] font-black">{Math.max(0, link.upvoteCount || 0)}</span>
                 </button>
                 <button 
                   onClick={() => handleVote('down')}
                   className={cn(
                     "flex items-center gap-1.5 transition-all hover:scale-110",
                     userVote === 'down' ? "text-rose-600 scale-110" : "text-slate-400"
                   )}
                 >
                   <ThumbsDown className={cn("w-4 h-4", userVote === 'down' && "fill-rose-600")} />
                   <span className="text-[10px] font-black">{Math.max(0, link.downvoteCount || 0)}</span>
                 </button>
               </div>
            </div>

            <div className={cn(
              "flex flex-col gap-4 pt-6 mt-2 border-t-2 border-black/5"
            )}>
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-bold gap-2",
                colorData.text
              )}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>更新: {format(link.updatedAt, 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-80">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">投稿者: {formatDisplayName(creatorData?.email)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isTestView ? (
                  <Link 
                    href={testHref}
                    target={link.testHtml ? undefined : "_blank"}
                    rel={link.testHtml ? undefined : "noopener noreferrer"}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 text-sm font-black transition-all px-4 py-3.5 rounded-xl border-2 group/btn",
                      hasTest 
                        ? "bg-blue-600 border-blue-700 text-white hover:bg-blue-700 hover:shadow-lg shadow-blue-200"
                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    確認テスト <ClipboardCheck className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                ) : (
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 text-sm font-black transition-all px-4 py-3.5 rounded-xl border-2 group/btn",
                      "bg-emerald-700 border-emerald-800 text-white hover:bg-emerald-800 hover:shadow-lg shadow-emerald-200"
                    )}
                  >
                    学習サイト <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mb-4 bg-white border border-black/5"
            )}>
              <Icon className={cn("w-8 h-8", colorData.text)} />
            </div>
            <DialogTitle className={cn("text-3xl font-bold leading-tight", colorData.darkText)}>
              {link.title}
            </DialogTitle>
            <div className="flex flex-col gap-1 pt-2">
              <DialogDescription className="flex items-center gap-2 text-slate-500 font-bold">
                <Clock className="w-4 h-4" />
                最終更新: {format(link.updatedAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </DialogDescription>
              <DialogDescription className="flex items-center gap-2 text-emerald-600 font-bold">
                <User className="w-4 h-4" />
                投稿者: {formatDisplayName(creatorData?.email)}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
               <div className="flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">受講完了</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-xl font-black text-emerald-900">{Math.max(0, link.completedCount || 0)}</span>
                  </div>
               </div>
               <div className="h-10 w-px bg-emerald-200" />
               <div className="flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">学習中</span>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-xl font-black text-emerald-900">{Math.max(0, link.learningCount || 0)}</span>
                  </div>
               </div>
               <div className="h-10 w-px bg-emerald-200" />
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">評価</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="w-5 h-5 text-emerald-600" />
                      <span className="text-lg font-black text-emerald-900">{Math.max(0, link.upvoteCount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ThumbsDown className="w-5 h-5 text-rose-600" />
                      <span className="text-lg font-black text-emerald-900">{Math.max(0, link.downvoteCount || 0)}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">リソースの説明</h4>
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 min-h-[100px] whitespace-pre-wrap text-slate-800 leading-relaxed">
                {link.description || '説明はありません。'}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">タグ</h4>
              <div className="flex flex-wrap gap-2">
                {link.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    onClick={() => {
                      setDetailOpen(false);
                      toggleTag(tag);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-black cursor-pointer transition-all border-2",
                      selectedTags.includes(tag) 
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-md" 
                        : "bg-white border-emerald-100 text-emerald-800 hover:bg-emerald-50"
                    )}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {isServerAdmin && (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-emerald-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> 学習中のユーザー
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700">
                      {learners?.length || 0} 名
                    </Badge>
                  </div>
                  <div className="bg-blue-50/30 rounded-3xl border-2 border-blue-100/50 overflow-hidden">
                    <ScrollArea className="h-32">
                      <div className="p-4 space-y-2">
                        {isLearnersLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <BookOpen className="w-5 h-5 text-blue-200 animate-pulse" />
                          </div>
                        ) : learners && learners.length > 0 ? (
                          learners.map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-50 shadow-sm">
                              <span className="text-xs font-bold text-blue-900">{formatDisplayName(l.email)}</span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                                <Calendar className="w-3 h-3" />
                                {l.startedAt ? format(l.startedAt, 'MM/dd HH:mm', { locale: ja }) : '記録なし'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-400 font-bold italic">学習中のユーザーはいません</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 受講完了したユーザー
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-200 text-emerald-700">
                      {completions?.length || 0} 名
                    </Badge>
                  </div>
                  <div className="bg-emerald-50/30 rounded-3xl border-2 border-emerald-100/50 overflow-hidden">
                    <ScrollArea className="h-32">
                      <div className="p-4 space-y-2">
                        {isCompletionsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Users className="w-5 h-5 text-emerald-200 animate-pulse" />
                          </div>
                        ) : completions && completions.length > 0 ? (
                          completions.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-emerald-50 shadow-sm">
                              <span className="text-xs font-bold text-emerald-900">{formatDisplayName(c.email)}</span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                                <Calendar className="w-3 h-3" />
                                {format(c.completedAt, 'MM/dd HH:mm', { locale: ja })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-400 font-bold italic">受講完了したユーザーはいません</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-emerald-100 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all"
                >
                  学習サイト <ExternalLink className="w-5 h-5" />
                </a>
                {hasTest && (
                  <Link 
                    href={testHref}
                    target={link.testHtml ? undefined : "_blank"}
                    rel={link.testHtml ? undefined : "noopener noreferrer"}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
                  >
                    確認テスト <ClipboardCheck className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setDetailOpen(false)}
                className="h-14 rounded-2xl font-bold px-8"
              >
                閉じる
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-950">リンクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-emerald-800 font-medium">
              「{link.title}」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl text-sm h-12 px-8 font-bold border-2 border-emerald-200 hover:bg-emerald-50">キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteLink(link.id);
                setDeleteDialogOpen(false);
              }} 
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm h-12 px-8 font-bold border-2 border-rose-700 shadow-lg shadow-rose-200"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

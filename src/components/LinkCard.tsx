
"use client";

import React, { useState } from 'react';
import { LearningLink } from '@/types/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface LinkCardProps {
  link: LearningLink;
  onEdit: (link: LearningLink) => void;
}

const SPARKLE_COLORS = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#ffffff', '#a855f7', '#ec4899'];

export const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit }) => {
  const { isAdmin, toggleComplete, deleteLink, duplicateLink } = useLinks();
  const { user } = useUser();
  const firestore = useFirestore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  
  // ユーザーの個別投票状態を取得
  const voteDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !link.id) return null;
    return doc(firestore, 'learningLinks', link.id, 'votes', user.uid);
  }, [firestore, user?.uid, link.id]);
  
  const { data: voteData } = useDoc<any>(voteDocRef);
  const userVote = voteData?.type as 'up' | 'down' | undefined;

  const Icon = getIcon(link.icon);
  const colorData = getColorData(link.color);

  const handleToggleComplete = () => {
    if (!link.isCompleted) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }
    toggleComplete(link.id);
  };

  const handleVote = (type: 'up' | 'down') => {
    if (!firestore || !user) return;
    const voteRef = doc(firestore, 'learningLinks', link.id, 'votes', user.uid);
    const linkRef = doc(firestore, 'learningLinks', link.id);

    if (userVote === type) {
      // 投票取り消し
      deleteDoc(voteRef).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: voteRef.path, operation: 'delete' })));
      
      const currentVoteCount = (link as any)[`${type}voteCount`] || 0;
      if (currentVoteCount > 0) {
        updateDoc(linkRef, {
          [`${type}voteCount`]: increment(-1)
        }).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: linkRef.path, operation: 'update' })));
      }
    } else {
      // 新規投票または投票変更
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

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 shadow-sm",
        cn(colorData.bg, colorData.border)
      )}>
        {link.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none z-0">
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
              {showSparkles && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    {[...Array(24)].map((_, i) => {
                      const angle = (i * 15) * (Math.PI / 180);
                      const distance = 50 + Math.random() * 80;
                      const x = Math.cos(angle) * distance;
                      const y = Math.sin(angle) * distance;
                      const color = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
                      
                      return (
                        <div 
                          key={i} 
                          className="absolute w-2 h-2 rounded-full animate-float-up"
                          style={{ 
                            backgroundColor: color,
                            top: '50%', 
                            left: '50%', 
                            margin: '-4px',
                            '--tw-translate-x': `${x}px`,
                            '--tw-translate-y': `${y}px`,
                            animationDelay: `${Math.random() * 0.1}s`,
                          } as any}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all",
                link.isCompleted 
                  ? "bg-emerald-600 border-emerald-700 text-white shadow-lg scale-105" 
                  : "bg-white/80 border-emerald-200 text-emerald-900"
              )}>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {link.isCompleted ? '受講済み' : '完了にする'}
                </span>
                <Checkbox 
                  checked={link.isCompleted} 
                  onCheckedChange={handleToggleComplete}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    link.isCompleted ? "bg-white text-emerald-700 border-white" : "bg-white border-emerald-300"
                  )}
                />
              </div>
              
              {isAdmin && (
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
                  variant="secondary" 
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-black border-2",
                    colorData.badge
                  )}
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-4 mt-2 border-t-2 border-black/5">
               <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{Math.max(0, link.completedCount || 0)}人が受講</span>
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
                "flex items-center justify-between text-[11px] font-bold",
                colorData.text
              )}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>最終更新日時: {format(link.updatedAt, 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                </div>
              </div>
              
              <div className="flex">
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
            <DialogDescription className="flex items-center gap-2 pt-2 text-slate-500 font-bold">
              <Clock className="w-4 h-4" />
              最終更新: {format(link.updatedAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            <div className="flex items-center gap-8 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">受講者数</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-xl font-black text-emerald-900">{Math.max(0, link.completedCount || 0)}</span>
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
                  <Badge key={tag} className="px-4 py-1.5 rounded-full bg-white border-2 border-emerald-100 text-emerald-800 font-black">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-emerald-100 flex flex-col sm:flex-row gap-4">
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all"
              >
                学習サイトを開く <ExternalLink className="w-5 h-5" />
              </a>
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

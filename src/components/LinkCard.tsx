"use client";

import React, { useState } from 'react';
import { LearningLink } from '@/types/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface LinkCardProps {
  link: LearningLink;
  onEdit: (link: LearningLink) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit }) => {
  const { isAdmin, toggleComplete, deleteLink, duplicateLink } = useLinks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  
  const Icon = getIcon(link.icon);
  const colorData = getColorData(link.color);

  const handleToggleComplete = () => {
    if (!link.isCompleted) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    }
    toggleComplete(link.id);
  };

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 shadow-sm",
        cn(colorData.bg, colorData.border)
      )}>
        {/* Sparkle Animation Overlay */}
        {showSparkles && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-yellow-400 animate-sparkle" />
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float-up"
                  style={{ 
                    top: '50%', 
                    left: '50%', 
                    margin: '-4px',
                    animationDelay: `${i * 0.1}s`,
                    transform: `rotate(${i * 60}deg) translateX(30px)`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-black/5 bg-white"
            )}>
              <Icon className={cn("w-7 h-7", colorData.text)} />
            </div>
            
            <div className="flex items-center gap-3">
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
            <h3 className={cn(
              "text-xl font-bold leading-snug line-clamp-2 transition-colors",
              colorData.darkText
            )}>
              {link.title}
            </h3>
            
            <p className={cn(
              "text-sm font-medium leading-relaxed line-clamp-3 h-14 text-slate-700"
            )}>
              {link.description || '概要の記載はありません。'}
            </p>

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

            <div className={cn(
              "flex flex-col gap-4 pt-6 mt-4 border-t-2 border-black/5"
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
              
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 text-sm font-black transition-all px-4 py-3.5 rounded-2xl border-2 group/btn",
                  "bg-emerald-700 border-emerald-800 text-white hover:bg-emerald-800 hover:shadow-lg shadow-emerald-200"
                )}
              >
                学習サイトを開く <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {link.isCompleted && (
            <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
          )}
        </CardContent>
      </Card>

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

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
  Clock
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
  
  const Icon = getIcon(link.icon);
  const colorData = getColorData(link.color);

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border-none transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10 bg-white border border-emerald-50",
        link.isCompleted && "bg-slate-50 opacity-90"
      )}>
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", colorData.bg)}>
              <Icon className={cn("w-7 h-7", colorData.text)} />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800">完了にする</span>
                <Checkbox 
                  checked={link.isCompleted} 
                  onCheckedChange={() => toggleComplete(link.id)}
                  className="w-5 h-5 rounded-full data-[state=checked]:bg-emerald-500 border-emerald-200"
                />
              </div>
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-50">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-xl border-emerald-50">
                    <DropdownMenuItem onClick={() => onEdit(link)} className="rounded-xl cursor-pointer text-xs h-10">
                      <Edit3 className="w-4 h-4 mr-2 text-emerald-600" /> 編集
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateLink(link.id)} className="rounded-xl cursor-pointer text-xs h-10">
                      <Copy className="w-4 h-4 mr-2 text-blue-600" /> 複製
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)} 
                      className="rounded-xl cursor-pointer text-rose-600 text-xs h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> 削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold leading-snug line-clamp-2 text-slate-800 group-hover:text-emerald-700 transition-colors">
              {link.title}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 h-14">
              {link.description || '概要の記載はありません。'}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {link.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border-none">
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-4 pt-6 mt-4 border-t border-emerald-50/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>最終更新日時: {format(link.updatedAt, 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                </div>
              </div>
              
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 hover:text-white transition-all bg-emerald-50 hover:bg-emerald-600 px-4 py-3 rounded-2xl border border-emerald-100/50 group/btn"
              >
                学習サイトを開く <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {link.isCompleted && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
              <CheckCircle2 className="w-40 h-40 text-emerald-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog moved outside DropdownMenu to prevent Portal conflicts */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-emerald-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">リンクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              「{link.title}」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs h-10 px-6 font-bold">キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteLink(link.id);
                setDeleteDialogOpen(false);
              }} 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs h-10 px-6 font-bold"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

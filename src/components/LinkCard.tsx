"use client";

import React from 'react';
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
import { formatDistanceToNow } from 'date-fns';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LinkCardProps {
  link: LearningLink;
  onEdit: (link: LearningLink) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit }) => {
  const { isAdmin, toggleComplete, deleteLink, duplicateLink } = useLinks();
  const Icon = getIcon(link.icon);
  const colorData = getColorData(link.color);

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-[2rem] border-none card-hover glass",
      link.isCompleted && "opacity-75 grayscale-[0.3]"
    )}>
      {/* Accent strip */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-2.5 shadow-sm", colorData.class)} />
      
      <CardContent className="p-7">
        <div className="flex justify-between items-start mb-5">
          <div className={cn("p-3.5 rounded-2xl shadow-sm", colorData.bg)}>
            <Icon className={cn("w-6 h-6", colorData.text)} />
          </div>
          
          <div className="flex items-center gap-1.5">
            <Checkbox 
              checked={link.isCompleted} 
              onCheckedChange={() => toggleComplete(link.id)}
              className="w-5 h-5 rounded-md data-[state=checked]:bg-emerald-500 border-emerald-200"
            />
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-emerald-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[150px] shadow-xl border-emerald-50">
                  <DropdownMenuItem onClick={() => onEdit(link)} className="rounded-xl cursor-pointer text-xs h-9">
                    <Edit3 className="w-3.5 h-3.5 mr-2" /> 編集
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateLink(link.id)} className="rounded-xl cursor-pointer text-xs h-9">
                    <Copy className="w-3.5 h-3.5 mr-2" /> 複製
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl cursor-pointer text-destructive text-xs h-9">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> 削除
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-emerald-50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">リンクを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          「{link.title}」を削除してもよろしいですか？この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl text-xs h-10 px-6">キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteLink(link.id)} className="rounded-xl bg-destructive text-destructive-foreground text-xs h-10 px-6">削除する</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-bold leading-tight line-clamp-2 text-foreground/90 group-hover:text-emerald-600 transition-colors">
            {link.title}
          </h3>
          
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
            {link.description || '概要の記載はありません。'}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {link.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="rounded-lg px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50/50 text-emerald-700 border-none">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-5 mt-3 border-t border-emerald-50/50">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(link.updatedAt, { addSuffix: true, locale: ja })}
            </div>
            
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-all bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-100/50 shadow-sm"
            >
              開く <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {link.isCompleted && (
          <div className="absolute top-4 right-10 text-emerald-500 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-6 h-6 fill-emerald-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

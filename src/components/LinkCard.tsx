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
      "group relative overflow-hidden rounded-4xl border-none card-hover glass",
      link.isCompleted && "opacity-80 grayscale-[0.5]"
    )}>
      {/* Accent strip */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-3", colorData.class)} />
      
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={cn("p-4 rounded-3xl", colorData.bg)}>
            <Icon className={cn("w-8 h-8", colorData.text)} />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={link.isCompleted} 
              onCheckedChange={() => toggleComplete(link.id)}
              className="w-6 h-6 rounded-lg data-[state=checked]:bg-primary"
            />
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                  <DropdownMenuItem onClick={() => onEdit(link)} className="rounded-xl cursor-pointer">
                    <Edit3 className="w-4 h-4 mr-2" /> 編集
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateLink(link.id)} className="rounded-xl cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" /> 複製
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl cursor-pointer text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> 削除
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-4xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>リンクを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。「{link.title}」を削除してもよろしいですか？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-2xl">キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteLink(link.id)} className="rounded-2xl bg-destructive text-destructive-foreground">削除する</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold leading-tight line-clamp-2">
            {link.title}
          </h3>
          
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
            {link.description || '概要はありません。'}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {link.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="rounded-full px-4 py-1 text-xs font-medium bg-white/50 dark:bg-black/20">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 mt-4 border-t border-dashed border-muted">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(link.updatedAt, { addSuffix: true, locale: ja })}
            </div>
            
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all"
            >
              サイトを見る <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {link.isCompleted && (
          <div className="absolute top-4 right-12 text-primary">
            <CheckCircle2 className="w-8 h-8 fill-primary/10" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
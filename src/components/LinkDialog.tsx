
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLinks } from '@/context/LinkContext';
import { LearningLink, LinkColor } from '@/types/link';
import { LINK_COLORS, LINK_ICONS } from '@/lib/constants';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLink: LearningLink | null;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ open, onOpenChange, editLink }) => {
  const { addLink, updateLink } = useLinks();
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    tags: [] as string[],
    color: 'emerald' as LinkColor,
    icon: 'book',
  });
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (open) {
      if (editLink) {
        setFormData({
          title: editLink.title,
          url: editLink.url,
          description: editLink.description || '',
          tags: editLink.tags,
          color: editLink.color,
          icon: editLink.icon,
        });
      } else {
        setFormData({
          title: '',
          url: '',
          description: '',
          tags: [],
          color: 'emerald',
          icon: 'book',
        });
      }
    }
  }, [editLink, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    if (editLink) {
      updateLink(editLink.id, { ...formData });
    } else {
      addLink({ ...formData });
    }
    onOpenChange(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold">
            {editLink ? 'リンクを編集' : '新しいリンクを追加'}
          </DialogTitle>
          <DialogDescription>
            学習リソースの情報を入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="title" className="text-base font-semibold">タイトル</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Next.jsの基礎" 
                className="rounded-2xl py-6"
                required
              />
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="url" className="text-base font-semibold">URL</Label>
              <Input 
                id="url" 
                value={formData.url} 
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com" 
                className="rounded-2xl py-6"
                required
              />
            </div>

            <div className="space-y-3 col-span-2">
              <Label htmlFor="description" className="text-base font-semibold">説明</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="内容のメモを入力してください" 
                className="rounded-2xl min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-4 col-span-2">
              <Label className="text-base font-semibold">タグ管理</Label>
              
              <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-muted/30 rounded-2xl">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="rounded-full px-3 py-1 flex items-center gap-1 bg-white shadow-sm text-foreground hover:bg-white border-none">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {formData.tags.length === 0 && <span className="text-sm text-muted-foreground italic">タグがありません</span>}
              </div>

              <div className="flex gap-2">
                <Input 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                  placeholder="タグ名を入力..." 
                  className="rounded-2xl"
                />
                <Button type="button" onClick={() => addTag(tagInput)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                  追加
                </Button>
              </div>
            </div>

            <div className="space-y-4 col-span-2">
              <Label className="text-base font-semibold">外観設定</Label>
              <div className="flex flex-wrap items-center gap-6 p-6 glass rounded-4xl">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground block">テーマカラー</span>
                  <div className="flex gap-3">
                    {LINK_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: c.name }))}
                        className={cn(
                          "w-8 h-8 rounded-full border-4 transition-all",
                          c.class,
                          formData.color === c.name ? "border-foreground scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-10 w-px bg-muted mx-2" />

                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground block">アイコン</span>
                  <div className="flex flex-wrap gap-2">
                    {LINK_ICONS.map(i => {
                      const IconComp = i.icon;
                      return (
                        <button
                          key={i.name}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: i.name }))}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            formData.icon === i.name ? "bg-emerald-600 text-white scale-110 shadow-lg" : "bg-muted hover:bg-emerald-50"
                          )}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 sm:justify-between items-center border-t border-emerald-50/50">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl">
              キャンセル
            </Button>
            <Button type="submit" className="rounded-2xl px-10 h-12 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-700">
              {editLink ? '更新する' : '保存する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
